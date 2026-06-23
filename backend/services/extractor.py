import time
from models.db import db, _now_iso
import uuid

class ExtractorService:
    """
    MS-Extractor (Patrón Adapter).
    Simula la recuperación de credenciales desde Secret Manager,
    la autenticación específica por país, y la normalización.
    """
    
    def __init__(self, pipeline_id):
        self.pipeline_id = pipeline_id
        self.pipeline = db.pipelines.get(pipeline_id)

    def extract(self):
        if not self.pipeline:
            raise Exception("Pipeline no encontrado")
            
        source = self.pipeline.get("source", {})
        source_type = source.get("type")
        secret_id = source.get("credentialsSecretId")
        
        # 1. Simular lectura de Secret Manager
        print(f"[MS-Extractor] Leyendo secretos desde: {secret_id}")
        time.sleep(0.5)
        
        # 2. Simular Adapter específico por país
        print(f"[MS-Extractor] Iniciando adaptador para: {source_type}")
        time.sleep(0.5)
        
        # 3. Extraer datos (Simulado)
        records_extracted = 150 if source_type == "SRI_ECUADOR" else 89
        print(f"[MS-Extractor] Extraídos {records_extracted} registros autorizados.")
        
        return {
            "recordsExtracted": records_extracted,
            "rawDataRef": f"gs://bucket/raw/{self.pipeline_id}/{uuid.uuid4()}.json"
        }
