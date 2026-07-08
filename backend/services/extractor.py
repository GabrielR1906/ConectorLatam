import time
import requests
from models.db import db, _now_iso
import uuid
import random

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
        
        # Filtros y modo incremental (HU05 y HU06)
        filters = self.pipeline.get("filters", {})
        incremental = filters.get("incrementalMode", True)
        last_checkpoint = self.pipeline.get("lastCheckpointDate")
        
        print(f"[MS-Extractor] Leyendo secretos desde: {secret_id}")
        time.sleep(0.5)
        
        print(f"[MS-Extractor] Conectando a servidor externo de {source_type}...")
        
        # Simulación de reintentos (HU13)
        max_retries = 3
        backoff_times = [1, 2, 4] # Segundos simulados en lugar de minutos
        
        records_extracted = 0
        
        for attempt in range(max_retries + 1):
            try:
                if source_type == "SRI_ECUADOR":
                    response = requests.get('http://localhost:5000/external-api/sri/comprobantes', timeout=5)
                    if response.status_code == 200:
                        records_extracted = len(response.json().get("comprobantes", []))
                    else:
                        raise Exception(f"HTTP Error {response.status_code}")
                elif source_type == "SAT_MEXICO":
                    # Simular inestabilidad del SAT
                    if random.random() < 0.3 and attempt < max_retries:
                        raise requests.exceptions.RequestException("Timeout WS Descarga Masiva SAT")
                    time.sleep(1.8)
                    records_extracted = random.randint(300, 500)
                elif source_type == "SUNAT_PERU":
                    time.sleep(0.5)
                    records_extracted = random.randint(100, 200)
                elif source_type == "DIAN_COLOMBIA":
                    time.sleep(0.8)
                    records_extracted = random.randint(50, 150)
                else:
                    time.sleep(0.5)
                    records_extracted = 89
                    
                print(f"[MS-Extractor] {source_type} Respondió OK en intento {attempt + 1}. Extraídos {records_extracted} comprobantes.")
                break # Éxito, salir del bucle de reintentos
                
            except requests.exceptions.RequestException as e:
                print(f"[MS-Extractor] Fallo de red ({source_type}): {e}")
                if attempt < max_retries:
                    wait_time = backoff_times[attempt]
                    print(f"[MS-Extractor] Reintentando en {wait_time}s... (Intento {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"Fallo definitivo de conexión con {source_type} tras {max_retries} reintentos.")
        
        # Simular extracción incremental (HU06)
        if incremental and last_checkpoint:
            print(f"[MS-Extractor] Aplicando modo incremental desde {last_checkpoint}")
            records_extracted = int(records_extracted * 0.15) # Simula que solo hay un 15% de documentos nuevos
            
        return {
            "recordsExtracted": records_extracted,
            "rawDataRef": f"gs://bucket/raw/{self.pipeline_id}/{uuid.uuid4()}.json"
        }
