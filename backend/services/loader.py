import time
from models.db import db, _now_iso
import uuid

class LoaderService:
    """
    MS-Loader.
    Recibe los datos limpios estandarizados y orquesta la inserción masiva
    hacia Google BigQuery, Snowflake o Amazon Redshift.
    """
    def __init__(self, pipeline_id, run_id, extract_data):
        self.pipeline_id = pipeline_id
        self.run_id = run_id
        self.pipeline = db.pipelines.get(pipeline_id)
        self.extract_data = extract_data

    def load(self):
        dest = self.pipeline.get("destination", {})
        dest_type = dest.get("type")
        dataset = dest.get("dataset")
        table = dest.get("table")
        
        print(f"[MS-Loader] Conectando a destino: {dest_type} ({dataset}.{table})")
        time.sleep(0.5)
        
        records_to_load = self.extract_data.get("recordsExtracted", 0)
        duplicates = 0
        if dest_type == "SNOWFLAKE":
            duplicates = 3
        
        records_loaded = records_to_load - duplicates
        
        print(f"[MS-Loader] Carga completada: {records_loaded} insertados, {duplicates} omitidos por duplicidad.")
        
        # Generar error simulado si es SNOWFLAKE (SAT) para la demostración de HU19
        if dest_type == "SNOWFLAKE":
            err_id = str(uuid.uuid4())
            if self.run_id not in db.error_logs:
                db.error_logs[self.run_id] = {}
            db.error_logs[self.run_id][err_id] = {
                "documentId": "CFDI-SIM-9999",
                "errorType": "SCHEMA_MISMATCH",
                "description": "El tipo de dato en el campo 'monto' no coincide con el destino en Snowflake",
                "timestamp": _now_iso()
            }
            
        return {
            "recordsLoaded": records_loaded,
            "recordsDuplicated": duplicates
        }
