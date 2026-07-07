import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const Wizard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    origin: '',
    name: '',
    identifier: '',
    password: '',
    destination: '',
    documentTypes: ['factura'],
    incrementalMode: true,
    cronExpression: '0 0 * * *'
  });

  const nextStep = () => {
    if (step === 1 && !formData.origin) return alert('Seleccione un origen');
    if (step === 2 && (!formData.identifier || !formData.password)) return alert('Complete las credenciales');
    setStep((prev) => Math.min(prev + 1, 3));
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePipeline = async () => {
    if (!formData.destination) return alert('Seleccione un destino');
    try {
      let token = 'dummy';
      if (currentUser) token = await currentUser.getIdToken();
      
      const payload = {
        origin: formData.origin,
        name: `Conector ${formData.origin.split('_')[0]} - ${formData.identifier}`,
        destination: formData.destination,
        password: formData.password, // Será cifrado en backend con AES-256
        documentTypes: formData.documentTypes,
        incrementalMode: formData.incrementalMode,
        cronExpression: formData.cronExpression
      };

      const res = await fetch(`${API_URL}/connectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("Pipeline creado exitosamente.");
        navigate('/client/dashboard');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'No autorizado'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al crear pipeline');
    }
  };

  return (
    <section className="view" id="view-wizard">
      <div className="wizard-container">
        <div className="wizard-progress">
          <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-circle">1</div>
            <span className="step-label">Origen Fiscal</span>
          </div>
          <div className={`step-connector ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <span className="step-label">Credenciales</span>
          </div>
          <div className={`step-connector ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-label">Destino</span>
          </div>
        </div>

        {step === 1 && (
          <div className="wizard-card">
            <div className="wizard-card-header">
              <h2>Selecciona el Ente Regulador Fiscal</h2>
              <p>Elige la entidad tributaria de la que extraerás los comprobantes electrónicos autorizados.</p>
            </div>
            <div className="source-grid">
              <button className={`source-card ${formData.origin === 'SRI_ECUADOR' ? 'active' : ''}`} onClick={() => updateForm('origin', 'SRI_ECUADOR')}>
                <div className="source-flag">🇪🇨</div>
                <div className="source-info">
                  <span className="source-name">Ecuador · SRI</span>
                  <span className="source-id-label">Identificador: RUC (13 dígitos)</span>
                </div>
                {formData.origin === 'SRI_ECUADOR' && <div className="source-check">✓</div>}
              </button>
              <button className={`source-card ${formData.origin === 'SAT_MEXICO' ? 'active' : ''}`} onClick={() => updateForm('origin', 'SAT_MEXICO')}>
                <div className="source-flag">🇲🇽</div>
                <div className="source-info">
                  <span className="source-name">México · SAT</span>
                  <span className="source-id-label">Identificador: RFC</span>
                </div>
                {formData.origin === 'SAT_MEXICO' && <div className="source-check">✓</div>}
              </button>
              <button className={`source-card ${formData.origin === 'SUNAT_PERU' ? 'active' : ''}`} onClick={() => updateForm('origin', 'SUNAT_PERU')}>
                <div className="source-flag">🇵🇪</div>
                <div className="source-info">
                  <span className="source-name">Perú · SUNAT</span>
                  <span className="source-id-label">Identificador: RUC</span>
                </div>
                {formData.origin === 'SUNAT_PERU' && <div className="source-check">✓</div>}
              </button>
              <button className={`source-card ${formData.origin === 'DIAN_COLOMBIA' ? 'active' : ''}`} onClick={() => updateForm('origin', 'DIAN_COLOMBIA')}>
                <div className="source-flag">🇨🇴</div>
                <div className="source-info">
                  <span className="source-name">Colombia · DIAN</span>
                  <span className="source-id-label">Identificador: NIT</span>
                </div>
                {formData.origin === 'DIAN_COLOMBIA' && <div className="source-check">✓</div>}
              </button>
            </div>
            <div className="wizard-nav">
              <span></span>
              <button className="btn btn-primary" onClick={nextStep}>Siguiente →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-card">
            <div className="wizard-card-header">
              <h2>Credenciales y Configuración (HU20)</h2>
              <p>Las credenciales se almacenan con cifrado <strong style={{color: '#8b5cf6'}}>AES-256 (Cryptography)</strong> y se protegen mediante Firebase / Secret Manager.</p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Identificador (RUC/RFC/NIT)</label>
                <input type="text" className="form-input" value={formData.identifier} onChange={(e) => updateForm('identifier', e.target.value)} placeholder="Ej: 1792..." />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña Clave Sol / Firma</label>
                <input type="password" className="form-input" value={formData.password} onChange={(e) => updateForm('password', e.target.value)} placeholder="••••••••••••" />
              </div>
              <div className="form-group form-group--full" style={{display: 'flex', gap: '20px'}}>
                <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <input type="checkbox" checked={formData.incrementalMode} onChange={(e) => updateForm('incrementalMode', e.target.checked)} />
                  Modo Incremental (HU06)
                </label>
                <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  Programación (HU12):
                  <select className="form-input" value={formData.cronExpression} onChange={(e) => updateForm('cronExpression', e.target.value)} style={{width: 'auto'}}>
                    <option value="0 * * * *">Cada Hora</option>
                    <option value="0 0 * * *">Diario (Medianoche)</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-ghost" onClick={prevStep}>← Atrás</button>
              <button className="btn btn-primary" onClick={nextStep}>Siguiente →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-card">
            <div className="wizard-card-header">
              <h2>Destino del Data Warehouse</h2>
              <p>Selecciona dónde se cargarán los datos fiscales procesados.</p>
            </div>
            <div className="dest-grid">
              <button className={`dest-card ${formData.destination === 'BIGQUERY' ? 'active' : ''}`} onClick={() => updateForm('destination', 'BIGQUERY')}>
                <div className="dest-info">
                  <span className="dest-name">Google BigQuery</span>
                  <span className="dest-desc">Data warehouse serverless</span>
                </div>
                {formData.destination === 'BIGQUERY' && <div className="dest-check">✓</div>}
              </button>
              <button className={`dest-card ${formData.destination === 'SNOWFLAKE' ? 'active' : ''}`} onClick={() => updateForm('destination', 'SNOWFLAKE')}>
                <div className="dest-info">
                  <span className="dest-name">Snowflake</span>
                  <span className="dest-desc">Cloud data platform</span>
                </div>
                {formData.destination === 'SNOWFLAKE' && <div className="dest-check">✓</div>}
              </button>
              <button className={`dest-card ${formData.destination === 'AMAZON_REDSHIFT' ? 'active' : ''}`} onClick={() => updateForm('destination', 'AMAZON_REDSHIFT')}>
                <div className="dest-info">
                  <span className="dest-name">Amazon Redshift</span>
                  <span className="dest-desc">AWS Data Warehouse</span>
                </div>
                {formData.destination === 'AMAZON_REDSHIFT' && <div className="dest-check">✓</div>}
              </button>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-ghost" onClick={prevStep}>← Atrás</button>
              <button className="btn btn-primary btn-lg" onClick={handleCreatePipeline}>Guardar y Ejecutar Pipeline</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Wizard;
