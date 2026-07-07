import time
import random
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
        
        # Simular carga a Data Warehouses (HU07, HU08, HU09) y deduplicación (HU11)
        if dest_type == "SNOWFLAKE":
            time.sleep(0.8)
            duplicates = int(records_to_load * 0.05) # 5% duplicados
        elif dest_type == "AMAZON_REDSHIFT":
            time.sleep(1.2) # Redshift COPY command simulación
            duplicates = int(records_to_load * 0.02)
        elif dest_type == "BIGQUERY":
            time.sleep(0.6)
            duplicates = int(records_to_load * 0.03)
        else:
            duplicates = 0
            
        records_loaded = max(0, records_to_load - duplicates)
        
        print(f"[MS-Loader] Carga completada: {records_loaded} insertados, {duplicates} omitidos por duplicidad.")
        
        # Generar error simulado aleatorio (HU19)
        if random.random() < 0.15:
            err_id = str(uuid.uuid4())
            if self.run_id not in db.error_logs:
                db.error_logs[self.run_id] = {}
            db.error_logs[self.run_id][err_id] = {
                "documentId": f"DOC-SIM-{random.randint(1000, 9999)}",
                "errorType": "SCHEMA_MISMATCH",
                "description": f"El tipo de dato no coincide con el destino en {dest_type}",
                "timestamp": _now_iso()
            }
            
        return {
            "recordsLoaded": records_loaded,
            "recordsDuplicated": duplicates
        }
