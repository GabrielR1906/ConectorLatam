import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://conectorlatam-backend.onrender.com/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ total_records: 0, active_connectors: 0, success_rate: 0, data_processed: '0 MB' });
  const [connectors, setConnectors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let token = 'dummy';
        if (currentUser) {
          token = await currentUser.getIdToken();
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [metricsRes, connRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/metrics`, { headers }),
          fetch(`${API_URL}/connectors`, { headers }),
          fetch(`${API_URL}/logs`, { headers })
        ]);

        if (metricsRes.ok) setMetrics(await metricsRes.json());
        if (connRes.ok) setConnectors(await connRes.json());
        if (logsRes.ok) {
          const allLogs = await logsRes.json();
          setLogs(allLogs.slice(0, 5)); // Solo los 5 más recientes para el dashboard
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSimulateRun = async (connectorId) => {
    try {
      let token = 'dummy';
      if (currentUser) token = await currentUser.getIdToken();
      
      const res = await fetch(`${API_URL}/simulate-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ connector_id: connectorId })
      });
      
      if (res.ok) {
        alert("Pipeline ejecutado correctamente.");
        // Refrescar datos
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Error al ejecutar: ${data.error || 'Desconocido'}`);
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const formatFlag = (origin) => {
    if (!origin) return '🌐';
    const lower = origin.toLowerCase();
    if (lower.includes('ecuador')) return '🇪🇨';
    if (lower.includes('mexico') || lower.includes('méxico')) return '🇲🇽';
    if (lower.includes('peru') || lower.includes('perú')) return '🇵🇪';
    if (lower.includes('colombia')) return '🇨🇴';
    return '🌐';
  };

  if (loading) return <div style={{padding: '2rem'}}>Cargando dashboard...</div>;

  return (
    <section className="view" id="view-dashboard">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Ciclo de Facturación Actual</span>
            <span className="kpi-value">{metrics.total_records.toLocaleString()}</span>
            <span className="kpi-sub">XMLs fiscales procesados</span>
          </div>
          <div className="kpi-trend kpi-trend--up">↑ Activo</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Conexiones Activas</span>
            <span className="kpi-value">{metrics.active_connectors}</span>
            <span className="kpi-sub">Sistemas integrados</span>
          </div>
          <div className="kpi-trend kpi-trend--neutral">→ Estable</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tasa de Éxito</span>
            <span className="kpi-value">{metrics.success_rate}%</span>
            <span className="kpi-sub">últimos 30 días</span>
          </div>
          <div className="kpi-trend kpi-trend--up">↑ Óptimo</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Datos Procesados</span>
            <span className="kpi-value">{metrics.data_processed}</span>
            <span className="kpi-sub">Volumen de transferencia</span>
          </div>
          <div className="kpi-trend kpi-trend--up">↑ Creciendo</div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Mis Conexiones Fiscales Activas</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/client/wizard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Conexión
        </button>
      </div>
      
      <div className="connectors-grid">
        {connectors.length === 0 ? (
          <p>No tienes conectores activos. Crea uno nuevo.</p>
        ) : (
          connectors.map(conn => (
            <div className="connector-card" key={conn.id}>
              <div className="connector-header">
                <div className="connector-origin">
                  <div className="origin-flag">{formatFlag(conn.origin)}</div>
                  <div className="origin-info">
                    <span className="origin-name">{conn.name}</span>
                    <span className="origin-id">{conn.origin}</span>
                  </div>
                </div>
                <div className={`connector-status ${conn.status === 'active' ? 'status-active' : ''}`}>
                  {conn.status.toUpperCase()}
                </div>
              </div>
              <div className="connector-body">
                <div className="connector-flow">
                  <div className="flow-node">API</div>
                  <div className="flow-line"></div>
                  <div className={`flow-node dest-${conn.destination.toLowerCase()}`}>{conn.destination.substring(0,2).toUpperCase()}</div>
                </div>
                <div className="connector-meta">
                  <div className="meta-item"><span className="meta-label">Destino:</span><span>{conn.destination}</span></div>
                  <div className="meta-item"><span className="meta-label">Procesados hoy:</span><span>{conn.records_today}</span></div>
                </div>
                <div style={{marginTop: '10px'}}>
                  <button className="btn btn-primary btn-sm" style={{width: '100%'}} onClick={() => handleSimulateRun(conn.id)}>
                    Ejecutar Ahora
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="section-header" style={{ marginTop: '2rem' }}>
        <h2 className="section-title">Historial Reciente <span className="badge badge--info">RF20</span></h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/client/logs')}>Ver historial completo →</button>
      </div>
      
      <div className="activity-table-wrapper">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Timestamp (ISO 8601)</th>
              <th>País Origen</th>
              <th>Registros Procesados</th>
              <th>Destino de Datos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="5">No hay registros recientes.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td style={{fontFamily: 'monospace', fontSize: '0.75rem'}}>{log.timestamp}</td>
                  <td><span className="table-origin"><span className="t-flag">{formatFlag(log.origin)}</span> {log.connector}</span></td>
                  <td className="t-num">{log.records.toLocaleString()}</td>
                  <td><span className={`t-dest t-dest--${log.destination.toLowerCase()}`}>{log.destination}</span></td>
                  <td>
                    <span className={`t-status ${log.status === 'SUCCESS' ? 't-status--success' : 't-status--failed'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Dashboard;
