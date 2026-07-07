import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Alerts = () => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let token = 'dummy';
      if (currentUser) token = await currentUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch(`${API_URL}/alerts`, { headers });
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [currentUser]);

  return (
    <section className="view" id="aview-alerts">
      <div className="section-header">
        <h2 className="section-title">Alertas del Sistema <span className="badge badge--error">{alerts.length}</span></h2>
        <button className="btn btn-ghost btn-sm" onClick={fetchAlerts}>Actualizar</button>
      </div>
      <div className="alerts-list">
        {loading ? (
          <p>Cargando alertas...</p>
        ) : alerts.length === 0 ? (
          <p>No hay alertas activas.</p>
        ) : (
          alerts.map(alert => (
            <div className="alert-row" key={alert.id}>
              <div className={`alert-icon alert-icon--${alert.severity === 'error' ? 'error' : 'warning'}`}>
                {alert.severity === 'error' ? '✗' : '⚠'}
              </div>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-meta">
                  ID: {alert.id.split('_')[1]} · {alert.timestamp} · {alert.message}
                </div>
              </div>
              {!alert.acknowledged && <button className="btn btn-ghost btn-xs">Acknowledge</button>}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Alerts;
