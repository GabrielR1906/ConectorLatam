from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os, time, uuid, json
from datetime import datetime

from models.db import db, _now_iso
from services.extractor import ExtractorService
from services.loader import LoaderService

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# ═══════════════════════════════════════════════════════════════════════════════
#  MS-API-Gateway (Simulado)
# ═══════════════════════════════════════════════════════════════════════════════

def verify_token():
    # Simulando Firebase Auth Middleware
    return "org_12345"  # Retorna el organizationId del token

@app.route('/')
def index():
    return app.send_static_file('index.html')

# ─── CLIENT ENDPOINTS ─────────────────────────────────────────────────────────

@app.route('/api/metrics', methods=['GET'])
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
def create_pipeline():
    org_id = verify_token()
    data = request.json
    new_id = f"pipe_{str(uuid.uuid4())[:8]}"
    db.pipelines[new_id] = {
        "organizationId": org_id,
        "name": data.get("name", "Nuevo Pipeline"),
        "status": "active",
        "source": {"type": data.get("origin", "UNKNOWN").upper().replace(" ", "_"), "authMethod": "CERTIFICATE", "credentialsSecretId": "secrets/nuevo/1"},
        "destination": {"type": data.get("destination", "BIGQUERY").upper(), "dataset": "default", "table": "default"},
        "filters": {"documentTypes": [], "status": [], "incrementalMode": True},
        "schedule": {"cronExpression": "0 0 * * *", "timezone": "UTC"},
        "lastRunId": None,
        "createdAt": _now_iso(),
        "updatedAt": _now_iso()
    }
    db.audit_log.insert(0, {
        "id": str(uuid.uuid4()), "timestamp": _now_iso(), "user": "Juan Espinosa", "role": "admin",
        "action": "CREATE_PIPELINE", "details": f"Pipeline creado: {data.get('origin')} a {data.get('destination')}",
        "ip_address": "192.168.1.100", "status": "success"
    })
    return jsonify({"success": True, "id": new_id})

@app.route('/api/simulate-run', methods=['POST'])
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
        status = "SUCCESS"
    except Exception as e:
        db.pipeline_runs[run_id]["status"] = "failed"
        db.pipeline_runs[run_id]["completedAt"] = _now_iso()
        db.pipeline_runs[run_id]["errorDetails"] = str(e)
        status = "FAILED"

    db.audit_log.insert(0, {
        "id": str(uuid.uuid4()), "timestamp": _now_iso(), "user": "Juan Espinosa", "role": "admin",
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
def admin_users():
    """Lista de todos los usuarios del sistema."""
    result = []
    for uid, u in db.users.items():
        org = db.organizations.get(u.get("organizationId"), {})
        result.append({
            "id": uid,
            "name": u["displayName"],
            "email": u["email"],
            "role": u["role"],
            "org_name": org.get("name", "—"),
            "org_plan": org.get("plan", "—"),
            "last_login": u["lastLogin"],
            "created_at": u["createdAt"],
            "status": "active"
        })
    return jsonify(result)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
