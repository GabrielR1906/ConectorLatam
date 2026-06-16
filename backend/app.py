from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os, time, random, uuid, hashlib, base64
from datetime import datetime, timedelta, timezone

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# ═══════════════════════════════════════════════════════════════════════════════
#  In-Memory Data Store
# ═══════════════════════════════════════════════════════════════════════════════

PLANS = {
    "starter":    {"name": "Starter",    "price": 149, "countries": 1, "destinations": 1},
    "growth":     {"name": "Growth",     "price": 299, "countries": 2, "destinations": 2},
    "multilatam": {"name": "Multi-LATAM","price": 499, "countries": 4, "destinations": 3},
}

DOC_TYPES = ["Factura Electrónica", "Nota de Crédito", "Nota de Débito",
             "Retención Electrónica", "Liquidación de Compra", "Guía de Remisión"]

COUNTRY_CONFIGS = {
    "SRI Ecuador":   {"id_label": "RUC", "id_digits": 13, "flag": "🇪🇨", "endpoint": "https://cel.sri.gob.ec/comprobantes-electronicos-ws"},
    "SAT México":    {"id_label": "RFC", "id_digits": 13, "flag": "🇲🇽", "endpoint": "https://cfdidescarga.sat.gob.mx/api"},
    "SUNAT Perú":    {"id_label": "RUC", "id_digits": 11, "flag": "🇵🇪", "endpoint": "https://api-cpe.sunat.gob.pe/v1"},
    "DIAN Colombia": {"id_label": "NIT", "id_digits": 9,  "flag": "🇨🇴", "endpoint": "https://catalogo-vpfe.dian.gov.co/api"},
}

connectors = [
    {
        "id": "conn-001",
        "name": "SRI Ecuador → BigQuery",
        "origin": "SRI Ecuador",
        "destination": "Google BigQuery",
        "tax_id": "1792456789001",
        "status": "active",
        "last_sync": (datetime.now() - timedelta(minutes=8)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "records_today": 1247,
        "records_cycle": 14250,
        "uptime": 99.8,
        "encrypted_key": "AES256:a3f8c2...[CIFRADO]",
        "plan": "growth"
    },
    {
        "id": "conn-002",
        "name": "SAT México → Snowflake",
        "origin": "SAT México",
        "destination": "Snowflake",
        "tax_id": "XAXX010101000",
        "status": "active",
        "last_sync": (datetime.now() - timedelta(minutes=3)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "records_today": 893,
        "records_cycle": 9812,
        "uptime": 98.6,
        "encrypted_key": "AES256:b7d1e9...[CIFRADO]",
        "plan": "growth"
    }
]

def _make_iso_log(offset_secs, level, message):
    ts = (datetime.now(timezone.utc) - timedelta(seconds=offset_secs)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return f"[{ts}] [{level}] {message}"

execution_logs = [
    {
        "id": str(uuid.uuid4()),
        "connector": "SRI Ecuador → BigQuery",
        "origin": "SRI Ecuador",
        "doc_type": "Factura Electrónica",
        "destination": "Google BigQuery",
        "timestamp": (datetime.now() - timedelta(minutes=8)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "SUCCESS",
        "records": 150,
        "duplicates_skipped": 0,
        "duration": "4.2s",
        "log_lines": [
            _make_iso_log(24, "INFO",    "Inicializando extracción incremental desde endpoints oficiales del SRI Ecuador..."),
            _make_iso_log(21, "DEBUG",   "Autenticando mediante RUC y mecanismo de certificado digital verificado."),
            _make_iso_log(17, "INFO",    "Descargando comprobantes electrónicos autorizados (Facturas/Retenciones)."),
            _make_iso_log(12, "DATA",    "Normalizando esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates)."),
            _make_iso_log(8,  "DEBUG",   "Aplicando deduplicación por clave compuesta (claveAcceso + secuencial)."),
            _make_iso_log(5,  "INFO",    "Cargando batch de 150 registros a Google BigQuery dataset: fiscal_data.comprobantes_sri..."),
            _make_iso_log(2,  "SUCCESS", "Ingesta completada con éxito en Google BigQuery. 150 registros nuevos insertados. 0 duplicados omitidos (RF18)."),
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "connector": "SAT México → Snowflake",
        "origin": "SAT México",
        "doc_type": "CFDI 4.0",
        "destination": "Snowflake",
        "timestamp": (datetime.now() - timedelta(hours=1, minutes=15)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "SUCCESS",
        "records": 89,
        "duplicates_skipped": 3,
        "duration": "3.1s",
        "log_lines": [
            _make_iso_log(4500, "INFO",    "Inicializando extracción incremental desde endpoints oficiales del SAT México..."),
            _make_iso_log(4497, "DEBUG",   "Autenticando mediante RFC y certificado CSD (Certificado de Sello Digital)."),
            _make_iso_log(4493, "INFO",    "Descargando CFDI 4.0 emitidos (Ingresos/Egresos/Traslados)."),
            _make_iso_log(4488, "DATA",    "Normalizando esquemas XML CFDI a estructuras relacionales estructuradas (ISO 8601 Dates)."),
            _make_iso_log(4485, "DEBUG",   "Detectados 3 CFDIs duplicados por UUID — omitidos del batch de inserción (RF18)."),
            _make_iso_log(4483, "SUCCESS", "Ingesta completada con éxito en Snowflake. 89 registros nuevos insertados. 3 duplicados omitidos (RF18)."),
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "connector": "SRI Ecuador → BigQuery",
        "origin": "SRI Ecuador",
        "doc_type": "Nota de Crédito",
        "destination": "Google BigQuery",
        "timestamp": (datetime.now() - timedelta(hours=3, minutes=40)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "WARNING",
        "records": 0,
        "duplicates_skipped": 0,
        "duration": "6.8s",
        "log_lines": [
            _make_iso_log(13200, "INFO",    "Inicializando extracción incremental desde endpoints oficiales del SRI Ecuador..."),
            _make_iso_log(13198, "DEBUG",   "Autenticando mediante RUC y mecanismo de certificado digital verificado."),
            _make_iso_log(13194, "WARNING", "Timeout de conexión en intento 1/3. Reintentando en 2s..."),
            _make_iso_log(13192, "WARNING", "Timeout de conexión en intento 2/3. Reintentando en 4s..."),
            _make_iso_log(13188, "DEBUG",   "Autenticación exitosa en intento 3/3."),
            _make_iso_log(13185, "INFO",    "Período consultado no contiene comprobantes nuevos. Watermark ya actualizado."),
            _make_iso_log(13183, "WARNING", "Pipeline finalizado con advertencias. 0 registros insertados. 2 reintentos registrados."),
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "connector": "SRI Ecuador → BigQuery",
        "origin": "SRI Ecuador",
        "doc_type": "Retención Electrónica",
        "destination": "Google BigQuery",
        "timestamp": (datetime.now() - timedelta(hours=7)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "SUCCESS",
        "records": 312,
        "duplicates_skipped": 5,
        "duration": "5.9s",
        "log_lines": [
            _make_iso_log(25200, "INFO",    "Inicializando extracción incremental desde endpoints oficiales del SRI Ecuador..."),
            _make_iso_log(25197, "DEBUG",   "Autenticando mediante RUC y mecanismo de certificado digital verificado."),
            _make_iso_log(25193, "INFO",    "Descargando comprobantes electrónicos autorizados (Facturas/Retenciones)."),
            _make_iso_log(25188, "DATA",    "Normalizando 317 esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates)."),
            _make_iso_log(25184, "DEBUG",   "Detectados 5 duplicados por claveAcceso — omitidos (RF18)."),
            _make_iso_log(25181, "INFO",    "Cargando batch de 312 registros a Google BigQuery dataset: fiscal_data.comprobantes_sri..."),
            _make_iso_log(25178, "SUCCESS", "Ingesta completada con éxito en Google BigQuery. 312 registros nuevos insertados. 5 duplicados omitidos (RF18)."),
        ]
    },
]

metrics = {
    "total_processed": 24891,
    "cycle_processed": 14250,
    "today_processed": 2140,
    "active_connectors": 2,
    "success_rate": 98.4,
    "avg_duration": 3.8,
    "duplicates_prevented": 847
}

# ═══════════════════════════════════════════════════════════════════════════════
#  Helper: AES-256 simulation
# ═══════════════════════════════════════════════════════════════════════════════

def simulate_aes256(value: str) -> str:
    """Simulate AES-256 encryption fingerprint (not real crypto — demo only)"""
    digest = hashlib.sha256(value.encode()).hexdigest()[:24]
    b64 = base64.b64encode(f"AES256_IV:{digest}".encode()).decode()[:32]
    return f"AES256::{b64}...[CIFRADO]"

# ═══════════════════════════════════════════════════════════════════════════════
#  Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify({**metrics, "connectors": connectors})

@app.route('/api/connectors', methods=['GET'])
def get_connectors():
    return jsonify(connectors)

@app.route('/api/connectors', methods=['POST'])
def create_connector():
    data = request.json or {}
    time.sleep(0.3)

    origin      = data.get('source', 'SRI Ecuador')
    destination = data.get('destination', 'Google BigQuery')
    tax_id      = data.get('tax_id', 'XXXXXXXXX001')
    cert_file   = data.get('cert_file', 'certificado.p12')

    # Simulate AES-256 encryption
    encrypted_key = simulate_aes256(tax_id + cert_file)

    new_id = f"conn-{str(uuid.uuid4())[:6]}"
    records = random.randint(40, 220)
    dups    = random.randint(0, 8)
    dur     = f"{random.uniform(2.5, 5.5):.1f}s"
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    cfg = COUNTRY_CONFIGS.get(origin, COUNTRY_CONFIGS["SRI Ecuador"])

    new_connector = {
        "id": new_id,
        "name": f"{origin} → {destination}",
        "origin": origin,
        "destination": destination,
        "tax_id": tax_id,
        "status": "active",
        "last_sync": now_iso,
        "records_today": records,
        "records_cycle": records,
        "uptime": 100.0,
        "encrypted_key": encrypted_key,
        "plan": data.get('plan', 'starter')
    }
    connectors.append(new_connector)
    metrics["active_connectors"] = len(connectors)

    t = datetime.now(timezone.utc)
    log_lines = [
        f"[{(t - timedelta(seconds=14)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Inicializando extracción incremental desde endpoints oficiales del {origin}...",
        f"[{(t - timedelta(seconds=12)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Conector ID: {new_id} | Destino: {destination}",
        f"[{(t - timedelta(seconds=11)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Verificando integridad del certificado digital {cert_file}...",
        f"[{(t - timedelta(seconds=10)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Aplicando cifrado AES-256 a credenciales sensibles (RNF03)...",
        f"[{(t - timedelta(seconds=9)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Credencial cifrada: {encrypted_key}",
        f"[{(t - timedelta(seconds=8)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Autenticando mediante {cfg['id_label']} y mecanismo de certificado digital verificado.",
        f"[{(t - timedelta(seconds=6)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Endpoint: {cfg['endpoint']}",
        f"[{(t - timedelta(seconds=5)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Descargando comprobantes electrónicos autorizados (Facturas/Retenciones).",
        f"[{(t - timedelta(seconds=4)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DATA]    Normalizando esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates).",
        f"[{(t - timedelta(seconds=3)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Detectados {dups} duplicados por clave compuesta — omitidos del batch de inserción (RF18).",
        f"[{(t - timedelta(seconds=2)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Cargando batch de {records} registros a {destination}...",
        f"[{t.strftime('%Y-%m-%dT%H:%M:%SZ')}] [SUCCESS] Ingesta completada con éxito en {destination}. {records} registros nuevos insertados. {dups} duplicados omitidos (RF18).",
    ]

    log_entry = {
        "id": str(uuid.uuid4()),
        "connector": f"{origin} → {destination}",
        "origin": origin,
        "doc_type": random.choice(DOC_TYPES),
        "destination": destination,
        "timestamp": now_iso,
        "status": "SUCCESS",
        "records": records,
        "duplicates_skipped": dups,
        "duration": dur,
        "log_lines": log_lines
    }
    execution_logs.insert(0, log_entry)
    metrics["total_processed"] += records
    metrics["cycle_processed"] += records
    metrics["today_processed"] += records
    metrics["duplicates_prevented"] += dups

    return jsonify({
        "success": True,
        "connector": new_connector,
        "encrypted_key": encrypted_key,
        "message": f"Pipeline activado. {records} registros sincronizados en {destination}. Cifrado AES-256 aplicado.",
        "initial_log": log_entry
    }), 201

@app.route('/api/logs', methods=['GET'])
def get_logs():
    # HU05 / HU18: Filtrado por fecha, tipo doc y estado
    date_from = request.args.get('date_from')
    date_to   = request.args.get('date_to')
    doc_type  = request.args.get('doc_type')
    status    = request.args.get('status')
    origin    = request.args.get('origin')

    filtered = list(execution_logs)
    if origin:
        filtered = [l for l in filtered if l['origin'] == origin]
    if doc_type:
        filtered = [l for l in filtered if l.get('doc_type','') == doc_type]
    if status:
        filtered = [l for l in filtered if l['status'] == status]
    if date_from:
        filtered = [l for l in filtered if l['timestamp'] >= date_from]
    if date_to:
        filtered = [l for l in filtered if l['timestamp'] <= date_to]

    return jsonify({"logs": filtered, "total": len(filtered)})

# HU10: Vista previa de datos (RF19)
@app.route('/api/preview', methods=['GET'])
def preview_data():
    connector_id = request.args.get('connector_id', 'conn-001')
    conn = next((c for c in connectors if c['id'] == connector_id), connectors[0] if connectors else None)
    if not conn:
        return jsonify({"error": "Conector no encontrado"}), 404

    origin = conn['origin']
    cfg = COUNTRY_CONFIGS.get(origin, COUNTRY_CONFIGS["SRI Ecuador"])
    doc_types_sample = ["Factura Electrónica", "Nota de Crédito", "Retención Electrónica"]
    statuses = ["Autorizado", "Autorizado", "Autorizado", "Anulado"]
    
    preview_records = []
    base_date = datetime.now(timezone.utc)
    for i in range(min(100, random.randint(45, 100))):
        rec_date = base_date - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        preview_records.append({
            "row": i + 1,
            "clave_acceso": f"{random.randint(10**47, 10**48-1)}",
            "tipo_comprobante": random.choice(doc_types_sample),
            "ruc_emisor": f"{random.randint(10**(cfg['id_digits']-1), 10**cfg['id_digits']-1)}",
            "razon_social": random.choice(["Empresa ABC S.A.", "Corp. Delta Ltda.", "Servicios XYZ CIA.", "Import Global S.A.", "Tech Solutions EC"]),
            "fecha_emision": rec_date.strftime("%Y-%m-%d"),
            "subtotal": round(random.uniform(50, 5000), 2),
            "iva": round(random.uniform(5, 600), 2),
            "total": round(random.uniform(55, 5600), 2),
            "estado": random.choice(statuses),
            "moneda": "USD" if origin in ["SRI Ecuador"] else ("MXN" if origin == "SAT México" else ("PEN" if origin == "SUNAT Perú" else "COP"))
        })
    
    schema = [
        {"column": "clave_acceso", "type": "STRING", "nullable": False},
        {"column": "tipo_comprobante", "type": "STRING", "nullable": False},
        {"column": "ruc_emisor", "type": "STRING", "nullable": False},
        {"column": "razon_social", "type": "STRING", "nullable": True},
        {"column": "fecha_emision", "type": "DATE", "nullable": False},
        {"column": "subtotal", "type": "DECIMAL(12,2)", "nullable": False},
        {"column": "iva", "type": "DECIMAL(12,2)", "nullable": False},
        {"column": "total", "type": "DECIMAL(12,2)", "nullable": False},
        {"column": "estado", "type": "STRING", "nullable": False},
        {"column": "moneda", "type": "STRING", "nullable": False},
    ]
    
    return jsonify({
        "connector_id": connector_id,
        "origin": origin,
        "destination": conn['destination'],
        "schema": schema,
        "records": preview_records,
        "total_records": len(preview_records),
        "message": f"Vista previa: {len(preview_records)} registros listos para carga a {conn['destination']}"
    })

# HU12: Programación de extracciones (RF08)
schedules = {}

@app.route('/api/connectors/schedule', methods=['POST'])
def set_schedule():
    data = request.json or {}
    connector_id = data.get('connector_id', 'conn-001')
    frequency = data.get('frequency', 'daily')  # daily, weekly, monthly, custom
    cron_expr = data.get('cron_expression', '0 6 * * *')
    
    schedules[connector_id] = {
        "connector_id": connector_id,
        "frequency": frequency,
        "cron_expression": cron_expr,
        "enabled": True,
        "next_run": (datetime.now(timezone.utc) + timedelta(hours=random.randint(1,24))).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    
    # Log audit
    audit_log.append({
        "id": str(uuid.uuid4()),
        "user": "Carlos Mendoza",
        "action": "SCHEDULE_CREATED",
        "target": connector_id,
        "params": f"frequency={frequency}, cron={cron_expr}",
        "result": "SUCCESS",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    })
    
    return jsonify({"success": True, "schedule": schedules[connector_id]})

@app.route('/api/connectors/schedule', methods=['GET'])
def get_schedules():
    return jsonify({"schedules": schedules})

# HU13: Retry simulation (RF21)
@app.route('/api/simulate-retry', methods=['POST'])
def simulate_retry():
    data = request.json or {}
    connector_id = data.get('connector_id', 'conn-001')
    conn = next((c for c in connectors if c['id'] == connector_id), connectors[0] if connectors else None)
    t = datetime.now(timezone.utc)
    origin = conn['origin'] if conn else 'SRI Ecuador'
    dest = conn['destination'] if conn else 'Google BigQuery'
    
    retry_lines = [
        f"[{(t - timedelta(seconds=420)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Inicializando extracción desde {origin}...",
        f"[{(t - timedelta(seconds=418)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [ERROR]   Error de conexión: ETIMEDOUT. Intento 1/3 fallido.",
        f"[{(t - timedelta(seconds=417)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Reintento automático (RF21). Esperando 1 minuto...",
        f"[{(t - timedelta(seconds=357)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Intento 2/3 iniciado...",
        f"[{(t - timedelta(seconds=355)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [ERROR]   Error de conexión: ECONNRESET. Intento 2/3 fallido.",
        f"[{(t - timedelta(seconds=354)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Reintento automático (RF21). Esperando 2 minutos...",
        f"[{(t - timedelta(seconds=234)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Intento 3/3 iniciado...",
        f"[{(t - timedelta(seconds=232)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [SUCCESS] Conexión reestablecida en intento 3/3.",
        f"[{(t - timedelta(seconds=230)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Descargando comprobantes electrónicos...",
        f"[{(t - timedelta(seconds=225)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [SUCCESS] Extracción completada con éxito tras 2 reintentos. {random.randint(50,200)} registros cargados a {dest}.",
    ]
    
    return jsonify({"success": True, "retry_log_lines": retry_lines, "retries_used": 2, "max_retries": 3})

@app.route('/api/simulate-run', methods=['POST'])
def simulate_run():
    data = request.json or {}
    connector_id = data.get('connector_id', 'conn-001')
    conn = next((c for c in connectors if c['id'] == connector_id), connectors[0])

    records = random.randint(30, 280)
    dups    = random.randint(0, 12)
    dur     = f"{random.uniform(2.0, 6.0):.1f}s"
    t       = datetime.now(timezone.utc)
    now_iso = t.strftime("%Y-%m-%dT%H:%M:%SZ")
    origin  = conn['origin']
    dest    = conn['destination']
    cfg     = COUNTRY_CONFIGS.get(origin, COUNTRY_CONFIGS["SRI Ecuador"])
    doc_t   = random.choice(DOC_TYPES)

    log_lines = [
        f"[{(t - timedelta(seconds=15)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Inicializando extracción incremental desde endpoints oficiales del {origin}...",
        f"[{(t - timedelta(seconds=14)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Autenticando mediante {cfg['id_label']} y mecanismo de certificado digital verificado.",
        f"[{(t - timedelta(seconds=12)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Endpoint remoto: {cfg['endpoint']} — Estado: 200 OK",
        f"[{(t - timedelta(seconds=10)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Descargando comprobantes electrónicos autorizados ({doc_t}).",
        f"[{(t - timedelta(seconds=8)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DATA]    Normalizando {records + dups} esquemas XML complejos a estructuras relacionales estructuradas (ISO 8601 Dates).",
        f"[{(t - timedelta(seconds=6)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Validando integridad por checksums SHA-256 de cada comprobante...",
        f"[{(t - timedelta(seconds=5)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Detectados {dups} duplicados por clave compuesta — omitidos del batch de inserción (RF18).",
        f"[{(t - timedelta(seconds=3)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO]    Cargando batch de {records} registros a {dest} (modo: INSERT IF NOT EXISTS)...",
        f"[{(t - timedelta(seconds=1)).strftime('%Y-%m-%dT%H:%M:%SZ')}] [DEBUG]   Actualizando watermark incremental: {now_iso}",
        f"[{t.strftime('%Y-%m-%dT%H:%M:%SZ')}] [SUCCESS] Ingesta completada con éxito en {dest}. {records} registros nuevos insertados. {dups} duplicados omitidos (RF18).",
    ]

    new_log = {
        "id": str(uuid.uuid4()),
        "connector": f"{origin} → {dest}",
        "origin": origin,
        "doc_type": doc_t,
        "destination": dest,
        "timestamp": now_iso,
        "status": "SUCCESS",
        "records": records,
        "duplicates_skipped": dups,
        "duration": dur,
        "log_lines": log_lines
    }
    execution_logs.insert(0, new_log)
    conn['last_sync'] = now_iso
    conn['records_today'] = conn.get('records_today', 0) + records
    conn['records_cycle'] = conn.get('records_cycle', 0) + records
    metrics["total_processed"] += records
    metrics["cycle_processed"] += records
    metrics["today_processed"] += records
    metrics["duplicates_prevented"] += dups
    
    # Audit log (HU23)
    audit_log.append({
        "id": str(uuid.uuid4()),
        "user": "Carlos Mendoza",
        "action": "PIPELINE_EXECUTED",
        "target": connector_id,
        "params": f"origin={origin}, dest={dest}, records={records}",
        "result": "SUCCESS",
        "timestamp": now_iso
    })

    return jsonify({"success": True, "log": new_log, "metrics": metrics})

# HU14: API Docs info (RF23)
@app.route('/api/docs-spec', methods=['GET'])
def api_docs_spec():
    return jsonify({
        "openapi": "3.0.3",
        "info": {"title": "ConectorLatam API", "version": "2.0.0", "description": "API REST para integración fiscal latinoamericana"},
        "endpoints": [
            {"method": "GET",  "path": "/api/metrics",            "description": "Obtener métricas del dashboard", "auth": "API Key"},
            {"method": "GET",  "path": "/api/connectors",         "description": "Listar todos los conectores activos", "auth": "API Key"},
            {"method": "POST", "path": "/api/connectors",         "description": "Crear un nuevo conector/pipeline", "auth": "API Key"},
            {"method": "GET",  "path": "/api/logs",               "description": "Listar historial de ejecuciones (filtrable)", "auth": "API Key"},
            {"method": "POST", "path": "/api/simulate-run",       "description": "Ejecutar un pipeline manualmente", "auth": "API Key"},
            {"method": "GET",  "path": "/api/preview",            "description": "Vista previa de hasta 100 registros", "auth": "API Key"},
            {"method": "POST", "path": "/api/connectors/schedule","description": "Programar extracción automática", "auth": "API Key"},
            {"method": "GET",  "path": "/api/logs/download",      "description": "Descargar logs en CSV o JSON", "auth": "API Key"},
            {"method": "GET",  "path": "/api/audit-log",          "description": "Consultar log de auditoría inmutable", "auth": "API Key"},
            {"method": "GET",  "path": "/api/usage",              "description": "Consultar consumo del plan actual", "auth": "API Key"},
            {"method": "GET",  "path": "/api/organizations",      "description": "Listar organizaciones del grupo", "auth": "API Key"},
            {"method": "GET",  "path": "/api/plans",              "description": "Listar planes y precios disponibles", "auth": "Pública"},
        ]
    })

# HU15: Descarga en CSV/JSON (RF25)
@app.route('/api/logs/download', methods=['GET'])
def download_logs():
    fmt = request.args.get('format', 'json')
    
    if fmt == 'csv':
        import io, csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["timestamp", "origin", "doc_type", "records", "duplicates_skipped", "destination", "status", "duration"])
        for log in execution_logs:
            writer.writerow([log['timestamp'], log['origin'], log.get('doc_type',''), log['records'], log.get('duplicates_skipped',0), log['destination'], log['status'], log.get('duration','')])
        from flask import Response
        return Response(output.getvalue(), mimetype='text/csv', headers={"Content-Disposition": "attachment; filename=conectorlatam_logs.csv"})
    else:
        safe_logs = [{k: v for k, v in l.items() if k != 'log_lines'} for l in execution_logs]
        return jsonify(safe_logs)

# HU17: Alertas (RF13)
alerts_config = {
    "email": "",
    "webhook_url": "",
    "on_failure": True,
    "on_timeout": True,
    "on_api_change": False,
}

@app.route('/api/alerts/config', methods=['GET'])
def get_alerts_config():
    return jsonify(alerts_config)

@app.route('/api/alerts/config', methods=['POST'])
def set_alerts_config():
    data = request.json or {}
    alerts_config.update(data)
    audit_log.append({
        "id": str(uuid.uuid4()),
        "user": "Carlos Mendoza",
        "action": "ALERTS_CONFIGURED",
        "target": "system",
        "params": str(data),
        "result": "SUCCESS",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    })
    return jsonify({"success": True, "config": alerts_config})

# HU19: Errores a nivel de registro (RF22 / RF26)
@app.route('/api/logs/<log_id>/errors', methods=['GET'])
def get_log_errors(log_id):
    log = next((l for l in execution_logs if l['id'] == log_id), None)
    if not log:
        return jsonify({"error": "Log no encontrado"}), 404
    
    num_errors = random.randint(0, 5)
    errors = []
    for i in range(num_errors):
        errors.append({
            "record_index": random.randint(1, 300),
            "comprobante_id": f"{random.randint(10**8, 10**9-1)}-{random.randint(1,999):03d}",
            "campo_error": random.choice(["fecha_emision", "ruc_emisor", "subtotal", "iva", "clave_acceso"]),
            "causa": random.choice([
                "Formato de fecha no válido (esperado: YYYY-MM-DD)",
                "RUC/RFC no coincide con formato del país",
                "Valor numérico fuera de rango permitido",
                "Campo obligatorio vacío",
                "Clave de acceso duplicada en el batch actual"
            ]),
            "severidad": random.choice(["ERROR", "WARNING"])
        })
    
    return jsonify({
        "log_id": log_id,
        "total_records": log.get('records', 0),
        "total_errors": len(errors),
        "errors": errors,
        "exportable": True
    })

# HU21: Multi-empresa (RF15)
organizations = [
    {"id": "org-001", "name": "Corporación Demo LATAM S.A.", "ruc": "1792456789001", "country": "Ecuador", "active": True},
    {"id": "org-002", "name": "Grupo Industrial Norte S.A. de C.V.", "ruc": "GIN8501012X3", "country": "México", "active": True},
    {"id": "org-003", "name": "Importaciones del Pacífico S.R.L.", "ruc": "20456789012", "country": "Perú", "active": False},
]

@app.route('/api/organizations', methods=['GET'])
def get_organizations():
    return jsonify({"organizations": organizations})

# HU22: Usuarios y Roles (RF16)
users = [
    {"id": "usr-001", "name": "Carlos Mendoza", "email": "carlos.mendoza@demo-latam.com", "role": "Administrador", "status": "Activo", "last_login": "2026-06-15T18:30:00Z"},
    {"id": "usr-002", "name": "Ana García", "email": "ana.garcia@demo-latam.com", "role": "Operador", "status": "Activo", "last_login": "2026-06-15T14:20:00Z"},
    {"id": "usr-003", "name": "Luis Ramírez", "email": "luis.ramirez@demo-latam.com", "role": "Visor", "status": "Activo", "last_login": "2026-06-14T09:45:00Z"},
    {"id": "usr-004", "name": "María Torres", "email": "maria.torres@demo-latam.com", "role": "Operador", "status": "Inactivo", "last_login": "2026-06-10T11:00:00Z"},
]

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify({"users": users})

@app.route('/api/users', methods=['POST'])
def update_user_role():
    data = request.json or {}
    user_id = data.get('user_id')
    new_role = data.get('role')
    user = next((u for u in users if u['id'] == user_id), None)
    if user and new_role in ['Administrador', 'Operador', 'Visor']:
        old_role = user['role']
        user['role'] = new_role
        audit_log.append({
            "id": str(uuid.uuid4()),
            "user": "Carlos Mendoza",
            "action": "ROLE_CHANGED",
            "target": user['name'],
            "params": f"old={old_role}, new={new_role}",
            "result": "SUCCESS",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        })
        return jsonify({"success": True, "user": user})
    return jsonify({"error": "Usuario o rol no válido"}), 400

# HU23: Log de auditoría inmutable (RF13 / RF17)
audit_log = [
    {"id": str(uuid.uuid4()), "user": "Carlos Mendoza", "action": "PIPELINE_CREATED", "target": "conn-001", "params": "origin=SRI Ecuador, dest=BigQuery", "result": "SUCCESS", "timestamp": (datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")},
    {"id": str(uuid.uuid4()), "user": "Carlos Mendoza", "action": "PIPELINE_EXECUTED", "target": "conn-001", "params": "records=150, dups=0", "result": "SUCCESS", "timestamp": (datetime.now(timezone.utc) - timedelta(days=4, hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ")},
    {"id": str(uuid.uuid4()), "user": "Ana García", "action": "CREDENTIAL_UPDATED", "target": "conn-002", "params": "field=certificate", "result": "SUCCESS", "timestamp": (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")},
    {"id": str(uuid.uuid4()), "user": "Carlos Mendoza", "action": "PIPELINE_CREATED", "target": "conn-002", "params": "origin=SAT México, dest=Snowflake", "result": "SUCCESS", "timestamp": (datetime.now(timezone.utc) - timedelta(days=2, hours=8)).strftime("%Y-%m-%dT%H:%M:%SZ")},
    {"id": str(uuid.uuid4()), "user": "Luis Ramírez", "action": "DASHBOARD_VIEWED", "target": "system", "params": "", "result": "SUCCESS", "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")},
    {"id": str(uuid.uuid4()), "user": "Carlos Mendoza", "action": "SCHEDULE_CREATED", "target": "conn-001", "params": "frequency=daily, cron=0 6 * * *", "result": "SUCCESS", "timestamp": (datetime.now(timezone.utc) - timedelta(hours=12)).strftime("%Y-%m-%dT%H:%M:%SZ")},
    {"id": str(uuid.uuid4()), "user": "Carlos Mendoza", "action": "ALERTS_CONFIGURED", "target": "system", "params": "email=carlos@demo.com, webhook=enabled", "result": "SUCCESS", "timestamp": (datetime.now(timezone.utc) - timedelta(hours=6)).strftime("%Y-%m-%dT%H:%M:%SZ")},
]

@app.route('/api/audit-log', methods=['GET'])
def get_audit_log():
    return jsonify({"audit_log": audit_log, "total": len(audit_log), "immutable": True})

# HU25: Consumo del plan (RF28)
@app.route('/api/usage', methods=['GET'])
def get_usage():
    plan_limits = {"starter": 10000, "growth": 50000, "multilatam": 200000}
    current_plan = "growth"
    limit = plan_limits.get(current_plan, 50000)
    used = metrics["cycle_processed"]
    pct = round((used / limit) * 100, 1)
    
    return jsonify({
        "plan": current_plan,
        "plan_name": PLANS[current_plan]["name"],
        "cycle_start": (datetime.now(timezone.utc).replace(day=1)).strftime("%Y-%m-%d"),
        "cycle_end": (datetime.now(timezone.utc).replace(day=1) + timedelta(days=30)).strftime("%Y-%m-%d"),
        "records_used": used,
        "records_limit": limit,
        "usage_pct": pct,
        "connectors_active": len(connectors),
        "connectors_limit": PLANS[current_plan]["countries"],
        "alert_threshold": 80,
        "over_threshold": pct >= 80,
        "renewal_date": (datetime.now(timezone.utc).replace(day=1) + timedelta(days=30)).strftime("%Y-%m-%d")
    })

@app.route('/api/plans', methods=['GET'])
def get_plans():
    return jsonify(PLANS)

@app.route('/api/trial', methods=['POST'])
def start_trial():
    data = request.json or {}
    return jsonify({
        "success": True,
        "trial_id": f"TRIAL-{str(uuid.uuid4())[:8].upper()}",
        "plan": data.get("plan", "growth"),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "message": "Prueba gratuita de 14 días activada exitosamente."
    })

if __name__ == '__main__':
    port  = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') != 'production'
    print("=" * 60)
    print("  ConectorLatam MVP v2 — Backend Server")
    print(f"  http://localhost:{port}")
    print("=" * 60)
    app.run(debug=debug, host='0.0.0.0', port=port)

