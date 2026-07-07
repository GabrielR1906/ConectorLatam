from flask import Flask, jsonify, request, Response, g
from flask_cors import CORS
import os, time, uuid, json
from datetime import datetime
from functools import wraps
from cryptography.fernet import Fernet
from apscheduler.schedulers.background import BackgroundScheduler

from models.db import db, _now_iso
from services.extractor import ExtractorService
from services.loader import LoaderService

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# ═══════════════════════════════════════════════════════════════════════════════
#  Cifrado de Credenciales (HU20)
# ═══════════════════════════════════════════════════════════════════════════════
# En un entorno real de GCP/Firebase, se usaría Secret Manager de Google Cloud.
# Aquí simulamos el cifrado AES-256 usando cryptography (Fernet usa AES en modo CBC).
SECRET_ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(SECRET_ENCRYPTION_KEY)

def encrypt_credential(text: str) -> str:
    return cipher_suite.encrypt(text.encode('utf-8')).decode('utf-8')

def decrypt_credential(cipher_text: str) -> str:
    return cipher_suite.decrypt(cipher_text.encode('utf-8')).decode('utf-8')

# ═══════════════════════════════════════════════════════════════════════════════
#  Programador de Tareas (APScheduler - HU12)
# ═══════════════════════════════════════════════════════════════════════════════
scheduler = BackgroundScheduler()

def run_scheduled_pipeline(pipeline_id):
    print(f"[Scheduler] Iniciando ejecución programada para pipeline {pipeline_id}")
    # Simula la llamada al servicio
    extractor = ExtractorService(pipeline_id)
    try:
        extract_result = extractor.extract()
        run_id = f"run_{str(uuid.uuid4())[:8]}"
        loader = LoaderService(pipeline_id, run_id, extract_result)
        loader.load()
        print(f"[Scheduler] Pipeline {pipeline_id} finalizado con éxito.")
    except Exception as e:
        print(f"[Scheduler] Error en pipeline {pipeline_id}: {e}")
        # Simulamos envío de alerta (HU17)
        db.system_alerts.insert(0, {
            "id": f"alert_{str(uuid.uuid4())[:8]}",
            "severity": "error",
            "title": f"Fallo en ejecución programada - {pipeline_id}",
            "message": f"Error: {str(e)}",
            "api": None,
            "timestamp": _now_iso(),
            "acknowledged": False,
            "affected_clients": []
        })

scheduler.start()

# ═══════════════════════════════════════════════════════════════════════════════
#  MS-API-Gateway (Simulado)
# ═══════════════════════════════════════════════════════════════════════════════

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore as fb_firestore

# Configurar Firebase Admin
# En Render.com los Secret Files se guardan en /etc/secrets/<filename>
# En local se busca en el mismo directorio que app.py
_RENDER_CREDS = '/etc/secrets/firebase-credentials.json'
_LOCAL_CREDS  = os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')
_CREDS_PATH   = _RENDER_CREDS if os.path.exists(_RENDER_CREDS) else _LOCAL_CREDS

cred = credentials.Certificate(_CREDS_PATH)
firebase_admin.initialize_app(cred)

# Cliente de Firestore — lee datos reales de la BD en la nube
firestore_db = fb_firestore.client()

# ═══════════════════════════════════════════════════════════════════════════════
#  Autenticación y Control de Acceso por Roles (RBAC)
#
#  JERARQUÍA DE ROLES:
#   super_admin  → Equipo ConectorLatam (dueños del sistema)
#                  Accede a: estado de APIs, métricas globales de todas las orgs,
#                  facturación (MRR/ARR), suspender clientes.
#
#   org_admin    → Administrador de una organización cliente
#                  Accede a: sus propios pipelines, crear/editar conectores,
#                  invitar usuarios a su org, ver logs de su org.
#
#   operator     → Operador de una organización cliente
#                  Accede a: ejecutar pipelines, ver logs y métricas de su org.
#                  NO puede crear ni borrar conectores.
#
#   viewer       → Solo lectura dentro de una organización cliente
#                  Accede a: ver dashboards y reportes. No puede ejecutar nada.
# ═══════════════════════════════════════════════════════════════════════════════

def verify_token():
    """
    Verifica el JWT de Firebase y carga el perfil real del usuario desde Firestore.
    - Decodifica el token para obtener el UID del usuario
    - Busca el documento users/{uid} en Firestore
    - Si no existe el documento, cae a db.py como fallback
    """
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        g.user = None
        return None

    token = auth_header.split('Bearer ')[1]

    try:
        # 1. Verificar token JWT con Firebase Admin SDK
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get('uid')
        firebase_email = decoded.get('email', '').lower()

        # 2. Leer perfil desde Firestore (users/{uid})
        user_doc = firestore_db.collection('users').document(uid).get()

        if user_doc.exists:
            # Datos reales desde Firestore
            profile = user_doc.to_dict()
            g.user = {
                'email':          profile.get('email', firebase_email),
                'displayName':    profile.get('displayName', decoded.get('name', firebase_email)),
                'role':           profile.get('role', 'viewer'),
                'organizationId': profile.get('organizationId'),
            }
        else:
            # Fallback: buscar por email en db.py (simulador local)
            user_found = None
            for user_data in db.users.values():
                if user_data.get('email', '').lower() == firebase_email:
                    user_found = user_data
                    break

            if user_found:
                g.user = user_found
            else:
                # Usuario sin perfil en ninguna DB → viewer mínimo
                g.user = {
                    'email':          firebase_email,
                    'displayName':    decoded.get('name', firebase_email),
                    'role':           'viewer',
                    'organizationId': None
                }

    except Exception as e:
        print(f"[verify_token] Error: {e}")
        g.user = None
        return None

    return g.user.get('organizationId')


def require_role(*allowed_roles):
    """Decorador RBAC — protege endpoints según la jerarquía de roles."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'user') or not g.user:
                verify_token()
            role = g.user.get('role')
            if role not in allowed_roles:
                return jsonify({
                    "error": "Acceso denegado.",
                    "detail": f"Tu rol '{role}' no tiene permiso para este recurso."
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ═══════════════════════════════════════════════════════════════════════════════
#  External API Mocks (Simuladores de APIs de Gobierno)
# ═══════════════════════════════════════════════════════════════════════════════

@app.route('/external-api/sri/comprobantes', methods=['GET'])
def mock_sri_api():
    """Simula el servicio de Autorización de Comprobantes del SRI."""
    # Simular latencia de red real
    time.sleep(0.4)
    return jsonify({
        "estado": "AUTORIZADO",
        "comprobantes": [
            {"claveAcceso": "0101202601179000000000120010010000000011234567812", "ruc": "1790000000001", "total": 150.50},
            {"claveAcceso": "0201202601179000000000120010010000000021234567813", "ruc": "1790000000001", "total": 890.00},
            {"claveAcceso": "0301202601179000000000120010010000000031234567814", "ruc": "1790000000001", "total": 45.25}
        ] * 50 # Multiplicado para simular 150 registros
    })

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/me', methods=['GET'])
def get_me():
    """
    Devuelve el perfil del usuario autenticado (rol, organización, nombre).
    El frontend llama a este endpoint justo después del login de Firebase
    para saber a qué panel redirigir al usuario y qué funciones mostrar.

    En producción: el token JWT de Firebase identifica al usuario
    y se busca su perfil en Firestore.
    En simulación: siempre devuelve el usuario definido en SIMULATED_USER_ID.
    """
    verify_token()
    return jsonify({
        "uid":            g.user.get("email"),       # En producción: decoded_token['uid']
        "displayName":    g.user.get("displayName"),
        "email":          g.user.get("email"),
        "role":           g.user.get("role"),
        "organizationId": g.user.get("organizationId"),
    })

# ─── ENDPOINTS DE CLIENTES (organizaciones) ───────────────────────────────────
# Accesibles por: org_admin, operator, viewer (cada uno con su nivel)
# El super_admin NO usa estos endpoints; tiene los de /api/admin/*
# Todos los datos se filtran SOLO a la organización del usuario autenticado.

@app.route('/api/metrics', methods=['GET'])
@require_role('org_admin', 'operator', 'viewer')
def get_metrics():
    org_id = verify_token()
    runs = db.get_organization_runs(org_id)

    total_runs = len(runs)
    success_runs = len([r for r in runs if r["status"] == "completed"])
    success_rate = (success_runs / total_runs * 100) if total_runs > 0 else 0

    total_records = sum(r["metrics"]["recordsLoaded"] for r in runs if r["status"] == "completed")

    return jsonify({
        "total_records": total_records,
        "active_connectors": len(db.get_organization_pipelines(org_id)),
        "success_rate": round(success_rate, 1),
        "data_processed": f"{round(total_records * 0.005, 1)} MB"
    })

@app.route('/api/connectors', methods=['GET'])
@require_role('org_admin', 'operator', 'viewer')
def get_pipelines():
    org_id = verify_token()
    pipelines = db.get_organization_pipelines(org_id)
    res = []
    for p in pipelines:
        runs = [r for r in db.get_organization_runs(org_id) if r["pipelineId"] == p["id"]]
        last_run = runs[0] if runs else None
        res.append({
            "id": p["id"],
            "name": p["name"],
            "origin": p["source"]["type"].replace("_", " ").title(),
            "destination": p["destination"]["type"].title(),
            "status": p["status"],
            "last_sync": last_run["startedAt"] if last_run else p["createdAt"],
            "records_today": last_run["metrics"]["recordsLoaded"] if last_run else 0,
            "records_cycle": sum(r["metrics"]["recordsLoaded"] for r in runs),
            "uptime": 99.9,
            "plan": "growth"
        })
    return jsonify(res)

@app.route('/api/connectors', methods=['POST'])
@require_role('org_admin')   # Solo el admin de la org puede crear conectores
def create_pipeline():
    org_id = verify_token()
    data = request.json
    new_id = f"pipe_{str(uuid.uuid4())[:8]}"
    
    # Cifrado simulado de la credencial (HU20)
    raw_password = data.get("password", "")
    encrypted_password = encrypt_credential(raw_password) if raw_password else None
    
    db.pipelines[new_id] = {
        "organizationId": org_id,
        "name": data.get("name", "Nuevo Pipeline"),
        "status": "active",
        "source": {
            "type": data.get("origin", "UNKNOWN").upper().replace(" ", "_"), 
            "authMethod": "CREDENTIALS", 
            "credentialsSecretId": f"secrets/{new_id}/1",
            "encryptedPassword": encrypted_password # Simulación de almacenamiento seguro
        },
        "destination": {"type": data.get("destination", "BIGQUERY").upper(), "dataset": "default", "table": "default"},
        "filters": {
            "documentTypes": data.get("documentTypes", []), 
            "status": data.get("status", []), 
            "incrementalMode": data.get("incrementalMode", True)
        },
        "schedule": {"cronExpression": data.get("cronExpression", "0 0 * * *"), "timezone": "UTC"},
        "lastRunId": None,
        "createdAt": _now_iso(),
        "updatedAt": _now_iso()
    }
    
    # Programar en APScheduler (HU12)
    # Simplificación para la simulación: programarlo para que corra 1 vez al día a medianoche
    scheduler.add_job(
        func=run_scheduled_pipeline, 
        trigger='cron', 
        hour=0, 
        minute=0, 
        args=[new_id], 
        id=new_id,
        replace_existing=True
    )
    
    db.audit_log.insert(0, {
        "id": str(uuid.uuid4()), "timestamp": _now_iso(), "user": g.user['displayName'], "role": g.user['role'],
        "action": "CREATE_PIPELINE", "details": f"Pipeline creado: {data.get('origin')} a {data.get('destination')}",
        "ip_address": "192.168.1.100", "status": "success"
    })
    return jsonify({"success": True, "id": new_id})

@app.route('/api/simulate-run', methods=['POST'])
@require_role('org_admin', 'operator')  # operator puede ejecutar, viewer no
def simulate_run():
    org_id = verify_token()
    data = request.json
    pipe_id = data.get('connector_id')
    if pipe_id == "conn-001": pipe_id = "pipe_sri_001"
    if pipe_id == "conn-002": pipe_id = "pipe_sat_002"

    if pipe_id not in db.pipelines:
        return jsonify({"error": "Pipeline no encontrado"}), 404

    run_id = f"run_{str(uuid.uuid4())[:8]}"
    db.pipeline_runs[run_id] = {
        "pipelineId": pipe_id, "organizationId": org_id, "status": "in_progress",
        "startedAt": _now_iso(), "completedAt": None,
        "metrics": {"recordsExtracted": 0, "recordsLoaded": 0, "recordsDuplicated": 0},
        "errorDetails": None, "checkpointDate": None
    }
    db.pipelines[pipe_id]["lastRunId"] = run_id

    try:
        extractor = ExtractorService(pipe_id)
        extract_result = extractor.extract()
        loader = LoaderService(pipe_id, run_id, extract_result)
        load_result = loader.load()
        db.pipeline_runs[run_id]["status"] = "completed"
        db.pipeline_runs[run_id]["completedAt"] = _now_iso()
        db.pipeline_runs[run_id]["metrics"] = {
            "recordsExtracted": extract_result["recordsExtracted"],
            "recordsLoaded": load_result["recordsLoaded"],
            "recordsDuplicated": load_result["recordsDuplicated"]
        }
        # Actualizar checkpoint para carga incremental
        db.pipeline_runs[run_id]["checkpointDate"] = _now_iso()
        db.pipelines[pipe_id]["lastCheckpointDate"] = _now_iso()
        status = "SUCCESS"
    except Exception as e:
        db.pipeline_runs[run_id]["status"] = "failed"
        db.pipeline_runs[run_id]["completedAt"] = _now_iso()
        db.pipeline_runs[run_id]["errorDetails"] = str(e)
        status = "FAILED"
        
        # Simulación de envío de alerta (HU17)
        print(f"📧 ALERTA: Enviando correo a {g.user['email']} por fallo en pipeline {pipe_id}")
        db.system_alerts.insert(0, {
            "id": f"alert_{str(uuid.uuid4())[:8]}",
            "severity": "error",
            "title": f"Fallo en ejecución manual - {pipe_id}",
            "message": f"Error: {str(e)}",
            "api": db.pipelines[pipe_id]['source']['type'],
            "timestamp": _now_iso(),
            "acknowledged": False,
            "affected_clients": [org_id]
        })

    db.audit_log.insert(0, {
        "id": str(uuid.uuid4()), "timestamp": _now_iso(), "user": g.user['displayName'], "role": g.user['role'],
        "action": "EXECUTE_PIPELINE", "details": f"Ejecución manual pipeline {pipe_id}", "status": status.lower()
    })
    return jsonify({"success": True, "status": status, "run_id": run_id, "metrics": db.pipeline_runs[run_id]["metrics"]})

@app.route('/api/simulate-retry', methods=['POST'])
def simulate_retry():
    time.sleep(1)
    return jsonify({"success": True, "message": "Extracción reintentada correctamente (Intento 1/3)"})

@app.route('/api/logs', methods=['GET'])
def get_logs():
    org_id = verify_token()
    runs = db.get_organization_runs(org_id)
    res = []
    for r in runs:
        pipe = db.pipelines.get(r["pipelineId"])
        res.append({
            "id": r["id"],
            "connector": pipe["name"] if pipe else "Desconocido",
            "origin": pipe["source"]["type"].replace("_", " ").title() if pipe else "",
            "destination": pipe["destination"]["type"].title() if pipe else "",
            "timestamp": r["startedAt"],
            "status": "SUCCESS" if r["status"] == "completed" else "FAILED",
            "records": r["metrics"]["recordsLoaded"],
            "duration": "3.5s"
        })
    return jsonify(res)

@app.route('/api/logs/<log_id>/errors', methods=['GET'])
def get_log_errors(log_id):
    errors = db.get_run_errors(log_id)
    formatted = [{"record_id": e["documentId"], "error_type": e["errorType"], "description": e["description"], "timestamp": e["timestamp"]} for e in errors]
    if not formatted:
        formatted = [{"record_id": "FACT-001", "error_type": "TIMEOUT", "description": "Conexión rechazada por SRI", "timestamp": _now_iso()}]
    return jsonify(formatted)

@app.route('/api/logs/download', methods=['GET'])
def download_logs():
    return Response("id,connector,status\n1,SRI Ecuador,SUCCESS", mimetype="text/csv",
                    headers={"Content-disposition": "attachment; filename=logs.csv"})

@app.route('/api/preview', methods=['GET'])
def preview_data():
    return jsonify({
        "schema": [{"name": "id", "type": "STRING"}, {"name": "total", "type": "FLOAT"}],
        "data": [{"id": "001-001-00001", "total": 150.50}]
    })

@app.route('/api/connectors/schedule', methods=['POST', 'GET'])
def schedule_connector():
    if request.method == 'GET':
        return jsonify({"cron": "0 0 * * *", "timezone": "America/Guayaquil"})
    return jsonify({"success": True, "message": "Programación actualizada"})

@app.route('/api/docs-spec', methods=['GET'])
def api_docs():
    return jsonify({"openapi": "3.0.0", "info": {"title": "ConectorLatam API"}})

@app.route('/api/alerts/config', methods=['GET', 'POST'])
def alerts_config():
    if request.method == 'GET':
        return jsonify({"email": "admin@empresa.com", "webhook": "https://hook.site", "notify_errors": True})
    return jsonify({"success": True})

@app.route('/api/organizations', methods=['GET'])
def get_orgs():
    return jsonify([{"id": k, "name": v["name"], "tax_id": v["taxId"], "country": v["country"]} for k, v in db.organizations.items()])

@app.route('/api/users', methods=['GET', 'POST'])
def handle_users():
    if request.method == 'GET':
        return jsonify([{"id": k, "name": v["displayName"], "email": v["email"], "role": v["role"], "last_login": v["lastLogin"]} for k, v in db.users.items()])
    return jsonify({"success": True})

@app.route('/api/audit-log', methods=['GET'])
def get_audit_log():
    return jsonify(db.audit_log)

@app.route('/api/usage', methods=['GET'])
def get_usage():
    org_id = verify_token()
    runs = db.get_organization_runs(org_id)
    records = sum(r["metrics"]["recordsLoaded"] for r in runs)
    return jsonify({
        "plan": "Growth", "cycle_start": "2026-06-01", "cycle_end": "2026-06-30",
        "records_processed": records, "records_limit": 50000,
        "connectors_active": len(db.get_organization_pipelines(org_id)), "connectors_limit": 2
    })

@app.route('/api/plans', methods=['GET'])
def get_plans():
    return jsonify({
        "starter":    {"name": "Starter",    "price": 149},
        "growth":     {"name": "Growth",     "price": 299},
        "multilatam": {"name": "Multi-LATAM","price": 499}
    })

@app.route('/api/trial', methods=['POST'])
def trial():
    return jsonify({"success": True, "message": "Prueba de 14 días activada", "trial_id": "TRL-999"})

# ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

@app.route('/api/admin/api-health', methods=['GET'])
def admin_api_health():
    """Estado en tiempo real de las 4 APIs fiscales gubernamentales."""
    return jsonify(db.api_health)

@app.route('/api/admin/clients', methods=['GET'])
def admin_clients():
    """Lista de organizaciones clientes con sus métricas."""
    result = []
    for org_id, org in db.organizations.items():
        users_count = sum(1 for u in db.users.values() if u.get("organizationId") == org_id)
        result.append({
            "id": org_id,
            "name": org["name"],
            "taxId": org["taxId"],
            "country": org["country"],
            "plan": org["plan"],
            "status": org["status"],
            "pipelines_active": org.get("pipelinesActive", 0),
            "records_cycle": org.get("recordsThisCycle", 0),
            "users_count": users_count,
            "created_at": org["createdAt"],
        })
    return jsonify(result)

@app.route('/api/admin/users', methods=['GET'])
@require_role('super_admin')
def admin_users_get():
    """Lista de todos los usuarios del sistema (lee desde Firestore si está disponible)."""
    try:
        # Leer desde Firestore real
        docs = firestore_db.collection('users').stream()
        result = []
        for doc in docs:
            u = doc.to_dict()
            org_id = u.get('organizationId')
            result.append({
                "id":         doc.id,
                "name":       u.get('displayName', '—'),
                "email":      u.get('email', '—'),
                "role":       u.get('role', 'viewer'),
                "org_name":   org_id or '—',
                "last_login": u.get('lastLogin', '—'),
                "created_at": u.get('createdAt', '—'),
                "status":     u.get('status', 'active')
            })
        return jsonify(result)
    except Exception:
        # Fallback a simulador
        result = []
        for uid, u in db.users.items():
            org = db.organizations.get(u.get("organizationId"), {})
            result.append({
                "id": uid, "name": u["displayName"], "email": u["email"],
                "role": u["role"], "org_name": org.get("name", "—"),
                "last_login": u["lastLogin"], "created_at": u["createdAt"], "status": "active"
            })
        return jsonify(result)

@app.route('/api/admin/users', methods=['POST'])
@require_role('super_admin')
def admin_users_create():
    """
    Crea un nuevo usuario en Firebase Auth y registra su perfil en Firestore.
    El rol 'super_admin' NO puede asignarse desde este endpoint.
    """
    verify_token()
    data = request.json or {}

    email        = data.get('email', '').strip()
    password     = data.get('password', '').strip()
    display_name = data.get('displayName', email).strip()
    role         = data.get('role', 'viewer').strip()
    org_id       = data.get('organizationId') or None

    # Validaciones
    if not email or not password:
        return jsonify({"error": "Email y contraseña son requeridos"}), 400
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

    # Bloquear asignación de super_admin desde la API
    ALLOWED_ROLES = ['org_admin', 'operator', 'viewer']
    if role not in ALLOWED_ROLES:
        return jsonify({
            "error": f"Rol '{role}' no permitido. Roles válidos: {ALLOWED_ROLES}"
        }), 400

    try:
        # 1. Crear usuario en Firebase Auth
        firebase_user = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        uid = firebase_user.uid

        # 2. Crear documento en Firestore con el perfil del usuario
        from datetime import datetime, timezone
        profile = {
            'email':          email,
            'displayName':    display_name,
            'role':           role,
            'organizationId': org_id,
            'createdAt':      datetime.now(timezone.utc).isoformat(),
            'lastLogin':      None,
            'status':         'active'
        }
        firestore_db.collection('users').document(uid).set(profile)

        return jsonify({
            "success": True,
            "uid":     uid,
            "email":   email,
            "role":    role,
            "message": f"Usuario {email} creado exitosamente"
        }), 201

    except firebase_auth.EmailAlreadyExistsError:
        return jsonify({"error": f"El email '{email}' ya está registrado"}), 409
    except Exception as e:
        return jsonify({"error": f"Error al crear usuario: {str(e)}"}), 500


@app.route('/api/admin/global-metrics', methods=['GET'])
def admin_global_metrics():
    """KPIs globales de toda la plataforma."""
    return jsonify(db.get_global_metrics())

@app.route('/api/admin/billing', methods=['GET'])
def admin_billing():
    """Registros de facturación y cobros."""
    total_revenue = sum(b["amount"] for b in db.billing if b["status"] == "paid")
    pending = sum(b["amount"] for b in db.billing if b["status"] == "pending")
    failed = sum(b["amount"] for b in db.billing if b["status"] == "failed")
    return jsonify({
        "invoices": db.billing,
        "summary": {
            "total_collected": total_revenue,
            "pending": pending,
            "failed": failed,
            "mrr": db.get_global_metrics()["mrr_usd"],
            "arr": db.get_global_metrics()["arr_usd"],
        }
    })

@app.route('/api/admin/plan-config', methods=['GET', 'POST'])
def admin_plan_config():
    """Configuración editable de los planes (precios y límites)."""
    if request.method == 'GET':
        return jsonify(db.plan_config)
    data = request.json
    if data:
        for plan_key, plan_data in data.items():
            if plan_key in db.plan_config:
                db.plan_config[plan_key].update(plan_data)
        db.audit_log.insert(0, {
            "id": str(uuid.uuid4()), "timestamp": _now_iso(), "user": "Admin ConectorLatam",
            "role": "superadmin", "action": "UPDATE_PLAN_CONFIG",
            "details": f"Configuración de planes actualizada", "status": "success"
        })
    return jsonify({"success": True, "plan_config": db.plan_config})

@app.route('/api/admin/system-alerts', methods=['GET'])
def admin_system_alerts():
    """Alertas del sistema: APIs caídas, pagos fallidos, SSL por vencer."""
    return jsonify(db.system_alerts)

@app.route('/api/admin/system-alerts/<alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """Marca una alerta como reconocida."""
    for alert in db.system_alerts:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            db.audit_log.insert(0, {
                "id": str(uuid.uuid4()), "timestamp": _now_iso(), "user": "Admin ConectorLatam",
                "role": "superadmin", "action": "ACKNOWLEDGE_ALERT",
                "details": f"Alerta reconocida: {alert['title']}", "status": "success"
            })
            return jsonify({"success": True})
    return jsonify({"error": "Alerta no encontrada"}), 404

@app.route('/api/admin/clients/<org_id>/suspend', methods=['POST'])
def suspend_client(org_id):
    """Suspende o reactiva una organización cliente."""
    if org_id in db.organizations:
        current = db.organizations[org_id]["status"]
        new_status = "active" if current == "suspended" else "suspended"
        db.organizations[org_id]["status"] = new_status
        db.audit_log.insert(0, {
            "id": str(uuid.uuid4()), "timestamp": _now_iso(), "user": "Admin ConectorLatam",
            "role": "superadmin", "action": "CHANGE_CLIENT_STATUS",
            "details": f"Organización {org_id} → {new_status}", "status": "success"
        })
        return jsonify({"success": True, "new_status": new_status})
    return jsonify({"error": "Organización no encontrada"}), 404

# ─── ENDPOINTS DE PLATAFORMA (solo super_admin / equipo ConectorLatam) ─────────

@app.route('/api/alerts', methods=['GET'])
@require_role('super_admin')
def get_alerts():
    verify_token()
    # super_admin ve TODAS las alertas del sistema
    return jsonify(db.get_alerts())

@app.route('/api/admin/metrics', methods=['GET'])
@require_role('super_admin')
def get_admin_metrics():
    verify_token()
    return jsonify(db.get_global_metrics())

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Para la prueba local (Simulación)
    print(f"🚀 MS-API-Gateway + Engine Iniciado en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
