import React from 'react';

const Pricing = () => {
  return (
    <section className="view" id="view-pricing">
      <div className="pricing-hero">
        <div className="pricing-hero-badge">Planes de Suscripción · Modelo de Negocio B2B SaaS</div>
        <h2 className="pricing-hero-title">Automatiza tu Integración Fiscal <br/>desde <span className="gradient-text">$149 / mes</span></h2>
        <p className="pricing-hero-sub">Conectores certificados · Cifrado AES-256 · SLA 99.9% · Sin código</p>
        <button className="btn btn-trial btn-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Iniciar Prueba Gratuita de 14 Días
        </button>
      </div>
      <div className="pricing-grid">
        <div className="pricing-card" id="plan-starter">
          <div className="pricing-card-header">
            <div>
              <h3 className="plan-name">Starter</h3>
              <p className="plan-desc">Para empezar en el mercado fiscal</p>
            </div>
          </div>
          <div className="plan-price"><span className="price-amount">$149</span><span className="price-period">/ mes</span></div>
          <ul className="plan-features">
            <li className="feature-item feature-item--yes"><span>✓</span> <strong>1 país fiscal</strong></li>
            <li className="feature-item feature-item--yes"><span>✓</span> <strong>1 destino</strong></li>
            <li className="feature-item feature-item--yes"><span>✓</span> Cifrado AES-256</li>
          </ul>
          <button className="btn btn-plan btn-plan--starter">Prueba 14 días gratis →</button>
        </div>
        
        <div className="pricing-card pricing-card--popular" id="plan-growth">
          <div className="popular-badge">⭐ MÁS POPULAR</div>
          <div className="pricing-card-header">
            <div>
              <h3 className="plan-name">Growth</h3>
              <p className="plan-desc">El preferido por los equipos de datos</p>
            </div>
          </div>
          <div className="plan-price"><span className="price-amount">$299</span><span className="price-period">/ mes</span></div>
          <ul className="plan-features">
            <li className="feature-item feature-item--yes"><span>✓</span> <strong>2 países fiscales</strong></li>
            <li className="feature-item feature-item--yes"><span>✓</span> <strong>2 destinos</strong></li>
            <li className="feature-item feature-item--yes"><span>✓</span> Dashboard avanzado</li>
          </ul>
          <button className="btn btn-plan btn-plan--growth">Prueba 14 días gratis →</button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
