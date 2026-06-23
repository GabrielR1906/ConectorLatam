import uuid
from datetime import datetime, timedelta, timezone

def _now_iso(offset_mins=0):
    return (datetime.now(timezone.utc) - timedelta(minutes=offset_mins)).strftime("%Y-%m-%dT%H:%M:%SZ")

class FirestoreSimulator:
    def __init__(self):
        # 1. users
        self.users = {
            "user_001": {
                "email": "juan@example.com",
                "displayName": "Juan Espinosa",
                "role": "admin",
                "organizationId": "org_12345",
                "createdAt": _now_iso(10000),
                "lastLogin": _now_iso(5)
            },
            "user_002": {
                "email": "ana.torres@corpodemo.com",
                "displayName": "Ana Torres",
                "role": "operator",
                "organizationId": "org_12345",
                "createdAt": _now_iso(8000),
                "lastLogin": _now_iso(120)
            },
            "user_003": {
                "email": "carlos.mendoza@grupoindustrial.com.mx",
                "displayName": "Carlos Mendoza",
                "role": "admin",
                "organizationId": "org_67890",
                "createdAt": _now_iso(5000),
                "lastLogin": _now_iso(45)
            },
            "user_004": {
                "email": "lucia.vargas@importpac.pe",
                "displayName": "Lucía Vargas",
                "role": "viewer",
                "organizationId": "org_11111",
                "createdAt": _now_iso(3000),
                "lastLogin": _now_iso(2880)
            },
            "user_005": {
                "email": "roberto.silva@taxsolutions.co",
                "displayName": "Roberto Silva",
                "role": "admin",
                "organizationId": "org_22222",
                "createdAt": _now_iso(1500),
                "lastLogin": _now_iso(30)
            }
        }

        # 2. organizations (multi-tenant)
        self.organizations = {
            "org_12345": {
                "name": "Corporación Demo LATAM S.A.",
                "taxId": "1790000000001",
                "country": "EC",
                "plan": "growth",
                "status": "active",
                "createdAt": _now_iso(10000),
                "pipelinesActive": 2,
                "recordsThisCycle": 14250,
            },
            "org_67890": {
                "name": "Grupo Industrial Norte S.A. de C.V.",
                "taxId": "GIN850312AB9",
                "country": "MX",
                "plan": "multilatam",
                "status": "active",
                "createdAt": _now_iso(5000),
                "pipelinesActive": 4,
                "recordsThisCycle": 38120,
            },
            "org_11111": {
                "name": "Importaciones del Pacífico S.R.L.",
                "taxId": "20456789123",
                "country": "PE",
                "plan": "starter",
                "status": "active",
                "createdAt": _now_iso(3000),
                "pipelinesActive": 1,
                "recordsThisCycle": 4890,
            },
            "org_22222": {
                "name": "TaxSolutions Colombia SAS",
                "taxId": "900456123",
                "country": "CO",
                "plan": "growth",
                "status": "active",
                "createdAt": _now_iso(1500),
                "pipelinesActive": 2,
                "recordsThisCycle": 9340,
            },
            "org_33333": {
                "name": "Distribuidora Andina Cia. Ltda.",
                "taxId": "1791234567001",
                "country": "EC",
                "plan": "starter",
                "status": "suspended",
                "createdAt": _now_iso(20000),
                "pipelinesActive": 0,
                "recordsThisCycle": 0,
            }
        }

        # 3. pipelines
        self.pipelines = {
            "pipe_sri_001": {
                "organizationId": "org_12345",
                "name": "Extracción SRI Mensual",
                "status": "active",
                "source": {
                    "type": "SRI_ECUADOR",
                    "authMethod": "CERTIFICATE",
                    "credentialsSecretId": "projects/my-gcp-project/secrets/sri_cert_org123/versions/1"
                },
                "destination": {
                    "type": "BIGQUERY",
                    "dataset": "tax_data_latam",
                    "table": "comprobantes_sri"
                },
                "filters": {
                    "documentTypes": ["factura", "nota_credito"],
                    "status": ["autorizado"],
                    "incrementalMode": True
                },
                "schedule": {
                    "cronExpression": "0 0 1 * *",
                    "timezone": "America/Guayaquil"
                },
                "lastRunId": "run_001",
                "createdAt": _now_iso(1000),
                "updatedAt": _now_iso(10)
            },
            "pipe_sat_002": {
                "organizationId": "org_12345",
                "name": "Extracción SAT México",
                "status": "active",
                "source": {
                    "type": "SAT_MEXICO",
                    "authMethod": "FIEL",
                    "credentialsSecretId": "projects/my-gcp-project/secrets/sat_fiel_org123/versions/1"
                },
                "destination": {
                    "type": "SNOWFLAKE",
                    "dataset": "tax_mx",
                    "table": "cfdi_40"
                },
                "filters": {
                    "documentTypes": ["ingreso", "egreso"],
                    "status": ["vigente"],
                    "incrementalMode": True
                },
                "schedule": {
                    "cronExpression": "0 2 * * *",
                    "timezone": "America/Mexico_City"
                },
                "lastRunId": "run_002",
                "createdAt": _now_iso(2000),
                "updatedAt": _now_iso(20)
            }
        }

        # 4. pipeline_runs
        self.pipeline_runs = {
            "run_001": {
                "pipelineId": "pipe_sri_001",
                "organizationId": "org_12345",
                "status": "completed",
                "startedAt": _now_iso(12),
                "completedAt": _now_iso(8),
                "metrics": {
                    "recordsExtracted": 150,
                    "recordsLoaded": 150,
                    "recordsDuplicated": 0
                },
                "errorDetails": None,
                "checkpointDate": _now_iso(1440)
            },
            "run_002": {
                "pipelineId": "pipe_sat_002",
                "organizationId": "org_12345",
                "status": "completed",
                "startedAt": _now_iso(75),
                "completedAt": _now_iso(74),
                "metrics": {
                    "recordsExtracted": 92,
                    "recordsLoaded": 89,
                    "recordsDuplicated": 3
                },
                "errorDetails": None,
                "checkpointDate": _now_iso(2880)
            }
        }

        # 5. error_logs
        self.error_logs = {
            "run_002": {
                "err_001": {
                    "documentId": "CFDI-001-9922",
                    "errorType": "SCHEMA_MISMATCH",
                    "description": "El tipo de dato en el campo 'monto' no coincide con el destino en Snowflake",
                    "timestamp": _now_iso(74)
                }
            }
        }

        # 6. audit_log
        self.audit_log = []

        # ── ADMIN DATA ────────────────────────────────────────────────────────────

        # 7. api_health — estado de las 4 APIs fiscales gubernamentales
        self.api_health = {
            "SRI_ECUADOR": {
                "name": "SRI Ecuador",
                "flag": "🇪🇨",
                "endpoint": "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline",
                "status": "operational",          # operational | degraded | outage
                "latency_ms": 342,
                "uptime_30d": 99.7,
                "last_check": _now_iso(2),
                "last_success": _now_iso(2),
                "checks_today": 144,
                "failures_today": 0,
                "ssl_expiry_days": 187,
                "region": "us-central1",
                "incidents": []
            },
            "SAT_MEXICO": {
                "name": "SAT México",
                "flag": "🇲🇽",
                "endpoint": "https://cfdidescargamasiva.clouda.sat.gob.mx/",
                "status": "degraded",
                "latency_ms": 1870,
                "uptime_30d": 97.2,
                "last_check": _now_iso(3),
                "last_success": _now_iso(18),
                "checks_today": 144,
                "failures_today": 6,
                "ssl_expiry_days": 42,
                "region": "us-east1",
                "incidents": [
                    {"timestamp": _now_iso(18), "description": "Latencia elevada en endpoint de descarga masiva", "resolved": False}
                ]
            },
            "SUNAT_PERU": {
                "name": "SUNAT Perú",
                "flag": "🇵🇪",
                "endpoint": "https://api-seguridad.sunat.gob.pe/v1/clientesextranet",
                "status": "operational",
                "latency_ms": 519,
                "uptime_30d": 99.1,
                "last_check": _now_iso(2),
                "last_success": _now_iso(2),
                "checks_today": 144,
                "failures_today": 1,
                "ssl_expiry_days": 234,
                "region": "us-west1",
                "incidents": []
            },
            "DIAN_COLOMBIA": {
                "name": "DIAN Colombia",
                "flag": "🇨🇴",
                "endpoint": "https://catalogo-vpfe.dian.gov.co/document/searchxml",
                "status": "outage",
                "latency_ms": None,
                "uptime_30d": 94.8,
                "last_check": _now_iso(5),
                "last_success": _now_iso(140),
                "checks_today": 144,
                "failures_today": 28,
                "ssl_expiry_days": 91,
                "region": "southamerica-east1",
                "incidents": [
                    {"timestamp": _now_iso(140), "description": "API no responde — mantenimiento no programado por DIAN", "resolved": False}
                ]
            }
        }

        # 8. billing — facturación de clientes
        self.billing = [
            {"id": "INV-2026-041", "org": "Corporación Demo LATAM S.A.", "plan": "Growth", "amount": 299, "currency": "USD", "status": "paid", "date": _now_iso(720), "method": "Stripe · Visa ****4242"},
            {"id": "INV-2026-042", "org": "Grupo Industrial Norte S.A. de C.V.", "plan": "Multi-LATAM", "amount": 499, "currency": "USD", "status": "paid", "date": _now_iso(700), "method": "Stripe · Mastercard ****5678"},
            {"id": "INV-2026-043", "org": "Importaciones del Pacífico S.R.L.", "plan": "Starter", "amount": 149, "currency": "USD", "status": "paid", "date": _now_iso(680), "method": "Stripe · Visa ****9012"},
            {"id": "INV-2026-044", "org": "TaxSolutions Colombia SAS", "plan": "Growth", "amount": 299, "currency": "USD", "status": "pending", "date": _now_iso(24), "method": "Stripe · Pendiente"},
            {"id": "INV-2026-045", "org": "Distribuidora Andina Cia. Ltda.", "plan": "Starter", "amount": 149, "currency": "USD", "status": "failed", "date": _now_iso(48), "method": "Stripe · Tarjeta rechazada"},
        ]

        # 9. plan_config — configuración editable de planes
        self.plan_config = {
            "starter": {
                "name": "Starter",
                "price": 149,
                "countries": 1,
                "destinations": 1,
                "records_limit": 10000,
                "history_days": 30,
                "support": "Email"
            },
            "growth": {
                "name": "Growth",
                "price": 299,
                "countries": 2,
                "destinations": 2,
                "records_limit": 50000,
                "history_days": 90,
                "support": "Business hours"
            },
            "multilatam": {
                "name": "Multi-LATAM",
                "price": 499,
                "countries": 4,
                "destinations": 3,
                "records_limit": 500000,
                "history_days": 365,
                "support": "24/7 Priority"
            }
        }

        # 10. system_alerts — alertas del sistema
        self.system_alerts = [
            {
                "id": "alert_001",
                "severity": "critical",
                "title": "DIAN Colombia — API No Disponible",
                "message": "El endpoint de la DIAN no responde desde hace 2h 20min. 3 clientes afectados con pipelines pausados.",
                "api": "DIAN_COLOMBIA",
                "timestamp": _now_iso(140),
                "acknowledged": False,
                "affected_clients": ["org_22222", "org_67890"]
            },
            {
                "id": "alert_002",
                "severity": "warning",
                "title": "SAT México — Latencia Elevada",
                "message": "Latencia promedio de 1870ms (umbral: 800ms). 6 fallos en las últimas 3 horas. Monitoreo activo.",
                "api": "SAT_MEXICO",
                "timestamp": _now_iso(18),
                "acknowledged": False,
                "affected_clients": ["org_12345", "org_67890"]
            },
            {
                "id": "alert_003",
                "severity": "warning",
                "title": "Certificado SSL SAT México — Vence en 42 días",
                "message": "El certificado SSL del endpoint del SAT vence el próximo mes. Renovar antes del vencimiento.",
                "api": "SAT_MEXICO",
                "timestamp": _now_iso(1440),
                "acknowledged": True,
                "affected_clients": []
            },
            {
                "id": "alert_004",
                "severity": "info",
                "title": "Pago fallido — Distribuidora Andina",
                "message": "El cobro de $149 USD para Distribuidora Andina falló por tarjeta rechazada. Cuenta suspendida automáticamente.",
                "api": None,
                "timestamp": _now_iso(48),
                "acknowledged": False,
                "affected_clients": ["org_33333"]
            }
        ]

    # ── Query Methods ─────────────────────────────────────────────────────────────

    def get_user(self, user_id):
        return self.users.get(user_id)

    def get_organization_pipelines(self, org_id):
        return [{**v, "id": k} for k, v in self.pipelines.items() if v["organizationId"] == org_id]

    def get_organization_runs(self, org_id):
        return sorted(
            [{**v, "id": k} for k, v in self.pipeline_runs.items() if v["organizationId"] == org_id],
            key=lambda x: x["startedAt"], reverse=True
        )

    def get_run_errors(self, run_id):
        errors = self.error_logs.get(run_id, {})
        return [{**v, "id": k} for k, v in errors.items()]

    def get_global_metrics(self):
        total_records = sum(
            r["metrics"]["recordsLoaded"]
            for r in self.pipeline_runs.values()
            if r["status"] == "completed"
        )
        total_runs = len(self.pipeline_runs)
        success_runs = sum(1 for r in self.pipeline_runs.values() if r["status"] == "completed")
        active_orgs = sum(1 for o in self.organizations.values() if o["status"] == "active")
        total_pipelines = len(self.pipelines)
        mrr = sum(
            {"starter": 149, "growth": 299, "multilatam": 499}.get(o["plan"], 0)
            for o in self.organizations.values()
            if o["status"] == "active"
        )
        return {
            "total_records_processed": total_records + 52110,  # + historical
            "active_organizations": active_orgs,
            "total_pipelines": total_pipelines + 7,            # + other orgs
            "global_success_rate": round((success_runs / total_runs * 100), 1) if total_runs else 0,
            "mrr_usd": mrr,
            "arr_usd": mrr * 12,
            "apis_operational": sum(1 for a in self.api_health.values() if a["status"] == "operational"),
            "apis_degraded": sum(1 for a in self.api_health.values() if a["status"] == "degraded"),
            "apis_outage": sum(1 for a in self.api_health.values() if a["status"] == "outage"),
            "open_alerts": sum(1 for a in self.system_alerts if not a["acknowledged"]),
        }

db = FirestoreSimulator()
