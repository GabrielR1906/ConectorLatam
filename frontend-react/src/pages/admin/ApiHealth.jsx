import React from 'react';

const ApiHealth = () => {
  return (
    <section className="view" id="aview-apis">
      <div className="section-header">
        <h2 className="section-title">Estado en Tiempo Real — APIs Fiscales Gubernamentales</h2>
        <button className="btn btn-ghost btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>
      <div className="api-health-grid" id="api-health-grid">
        <div className="api-status-card api-status-card--ok">
          <div className="api-s-header">
            <div className="api-s-name">🇪🇨 SRI Ecuador</div>
            <div className="api-s-badge">OK</div>
          </div>
          <div className="api-s-metrics">
            <div className="api-m-item"><span className="api-m-lbl">Latencia</span><span className="api-m-val">124ms</span></div>
            <div className="api-m-item"><span className="api-m-lbl">Uptime 24h</span><span className="api-m-val">100%</span></div>
          </div>
        </div>
        <div className="api-status-card api-status-card--down">
          <div className="api-s-header">
            <div className="api-s-name">🇲🇽 SAT México</div>
            <div className="api-s-badge">DOWN</div>
          </div>
          <div className="api-s-metrics">
            <div className="api-m-item"><span className="api-m-lbl">Latencia</span><span className="api-m-val">Timeout</span></div>
            <div className="api-m-item"><span className="api-m-lbl">Uptime 24h</span><span className="api-m-val">98.2%</span></div>
          </div>
        </div>
      </div>

      <div className="section-header" style={{marginTop: '2rem'}}>
        <h2 className="section-title">Incidentes Activos</h2>
      </div>
      <div className="incidents-panel">
        <div className="incident-item incident-item--critical">
          <div className="inc-icon">🚨</div>
          <div className="inc-body">
            <strong>SAT México (WS de Descarga Masiva) inestable.</strong>
            <span>Detectados timeouts repetidos en las últimas 2 horas. Backoff exponencial activado automáticamente para clientes afectados.</span>
          </div>
          <div className="inc-time">Hace 45 min</div>
        </div>
      </div>
    </section>
  );
};

export default ApiHealth;
