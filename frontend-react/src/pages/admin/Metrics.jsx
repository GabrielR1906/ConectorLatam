import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'https://conectorlatam-backend.onrender.com/api';

const Metrics = () => {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        let token = 'dummy';
        if (currentUser) token = await currentUser.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const res = await fetch(`${API_URL}/admin/metrics`, { headers });
        if (res.ok) {
          setMetrics(await res.json());
        }
      } catch (error) {
        console.error("Error fetching admin metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [currentUser]);

  if (loading) return <div style={{padding: '2rem'}}>Cargando métricas...</div>;
  if (!metrics) return <div style={{padding: '2rem'}}>Error cargando métricas.</div>;

  return (
    <section className="view" id="aview-metrics">
      <div className="section-header">
        <h2 className="section-title">Métricas Globales (Plataforma)</h2>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--purple">🏢</div>
          <div className="kpi-content">
            <span className="kpi-label">Organizaciones Activas</span>
            <span className="kpi-value">{metrics.active_organizations} / {metrics.total_organizations}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--cyan">🔄</div>
          <div className="kpi-content">
            <span className="kpi-label">Pipelines Registrados</span>
            <span className="kpi-value">{metrics.total_pipelines}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--green">🗄️</div>
          <div className="kpi-content">
            <span className="kpi-label">Registros Procesados</span>
            <span className="kpi-value">{metrics.total_extracted.toLocaleString()}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--amber">⭐</div>
          <div className="kpi-content">
            <span className="kpi-label">Tasa Éxito Global</span>
            <span className="kpi-value">{metrics.success_rate}%</span>
          </div>
        </div>
      </div>

      <div className="section-header" style={{marginTop: '2rem'}}>
        <h2 className="section-title">Distribución de Destinos (Data Warehouses)</h2>
      </div>
      <div className="metrics-chart-placeholder" style={{
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: 'var(--radius-lg)', 
        height: '250px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'var(--text-secondary)'
      }}>
        [Gráfico Circular: Simulado para Demostración]
      </div>
    </section>
  );
};

export default Metrics;
