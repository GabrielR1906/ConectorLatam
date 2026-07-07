import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Logs = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let token = 'dummy';
      if (currentUser) token = await currentUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [logsRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/logs`, { headers }),
        fetch(`${API_URL}/audit-log`, { headers })
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  const filteredLogs = logs.filter(log => {
    if (filterStatus && log.status !== filterStatus) return false;
    if (filterOrigin && log.origin !== filterOrigin) return false;
    return true;
  });

  const uniqueOrigins = [...new Set(logs.map(l => l.origin))];

  return (
    <section className="view" id="view-logs">
      <div className="logs-layout">
        <div className="logs-panel">
          <div className="panel-header" style={{flexDirection: 'column', alignItems: 'stretch', gap: '10px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h2>Historial de Ejecuciones <span className="badge badge--info">RF17 · RF20 · RF22</span></h2>
              <div className="panel-actions">
                <button className="btn btn-ghost btn-sm" onClick={fetchLogs}>Actualizar</button>
              </div>
            </div>
            <div className="logs-filters" style={{display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center'}}>
              <select className="form-select-sm" value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}>
                <option value="">Todos los orígenes</option>
                {uniqueOrigins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <select className="form-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Cualquier Estado</option>
                <option value="SUCCESS">✓ Éxito</option>
                <option value="FAILED">✗ Error</option>
              </select>
            </div>
          </div>
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp (ISO 8601)</th>
                  <th>País Origen</th>
                  <th>Registros</th>
                  <th>Destino</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5">Cargando...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan="5">No hay registros que coincidan.</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{fontFamily: 'monospace', fontSize: '0.75rem'}}>{log.timestamp}</td>
                      <td>{log.origin}</td>
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
        </div>
        <div className="terminal-panel">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot--red"></span>
              <span className="dot dot--yellow"></span>
              <span className="dot dot--green"></span>
            </div>
            <span className="terminal-title">conectorlatam-etl-engine · audit-log</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setAuditLogs([])}>Limpiar</button>
          </div>
          <div className="terminal-body" style={{overflowY: 'auto'}}>
            <div className="terminal-welcome">Engine listo. Conectado a Audit Log...</div>
            {auditLogs.map(al => (
              <div key={al.id} style={{marginTop: '4px', fontSize: '0.7rem', color: al.status === 'failed' ? '#f87171' : 'var(--text-secondary)'}}>
                <span style={{color: '#94a3b8'}}>[{al.timestamp}]</span> {al.user} ({al.role}) - {al.action}: {al.details} [{al.status}]
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Logs;
