import React from 'react';

const ApiDocs = () => {
  return (
    <section className="view" id="view-apidocs">
      <div className="section-header">
        <h2 className="section-title">Documentación API REST <span className="badge badge--info">RF23</span></h2>
        <span className="badge badge--success">OpenAPI 3.0.3</span>
      </div>
      <div className="api-docs-intro" style={{background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px'}}>
        <h3 style={{color: 'var(--text-primary)', fontSize: '.95rem', marginBottom: '8px'}}>ConectorLatam API v2.0.0</h3>
        <p style={{color: 'var(--text-secondary)', fontSize: '.8rem', marginBottom: '12px'}}>API REST para integración fiscal latinoamericana. Usa tu API Key para autenticarte.</p>
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px'}}>
          <span className="badge badge--success">Base URL: /api</span>
          <span className="badge badge--info">Auth: API Key Header</span>
          <span className="badge badge--warning">Rate Limit: 100 req/min</span>
        </div>
        <div style={{background: 'var(--bg-base)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '10px', fontFamily: "'JetBrains Mono',monospace", fontSize: '.72rem', color: 'var(--accent-cyan)'}}>
          curl -H "Authorization: Bearer pk_live_51MabcxYz123" https://api.conectorlatam.com/api/metrics
        </div>
      </div>
      <div className="api-endpoints-list">
        {/* Render endpoints here */}
        <div className="endpoint-card">
          <div className="endpoint-header">
            <span className="http-method method-get">GET</span>
            <span className="endpoint-path">/api/v1/metrics/overall</span>
          </div>
          <div className="endpoint-desc">Obtener métricas globales del sistema.</div>
        </div>
      </div>
    </section>
  );
};

export default ApiDocs;
