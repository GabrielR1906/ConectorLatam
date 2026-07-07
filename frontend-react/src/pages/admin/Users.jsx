import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'https://conectorlatam-backend.onrender.com/api';

const ROLE_LABELS = {
  org_admin: { label: 'Admin de Org', color: '#6366f1' },
  operator:  { label: 'Operador',     color: '#10b981' },
  viewer:    { label: 'Viewer',       color: '#64748b' },
};

export default function Users() {
  const { getToken } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'org_admin',
    organizationId: '',
  });

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al crear el usuario');
      } else {
        setSuccess(`✅ Usuario ${form.email} creado exitosamente`);
        setForm({ displayName: '', email: '', password: '', role: 'org_admin', organizationId: '' });
        setShowForm(false);
        fetchUsers();
      }
    } catch (e) {
      setError('Error de conexión con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="admin-users-page" style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Gestión de Usuarios
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
            Crea y administra los usuarios de la plataforma
          </p>
        </div>
        <button
          id="btn-new-user"
          onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '10px 20px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Notificaciones */}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', color: '#10b981', fontWeight: 500 }}>
          {success}
        </div>
      )}

      {/* Modal / Formulario de creación */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card, #1e293b)', borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Crear Nuevo Usuario
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.4rem' }}>×</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nombre completo</label>
                <input id="input-display-name" name="displayName" value={form.displayName} onChange={handleChange} required placeholder="Ej: Juan Espinosa"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border, #334155)', background: 'var(--bg-input, #0f172a)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Email</label>
                <input id="input-email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="usuario@empresa.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border, #334155)', background: 'var(--bg-input, #0f172a)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Contraseña temporal</label>
                <input id="input-password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Mín. 6 caracteres"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border, #334155)', background: 'var(--bg-input, #0f172a)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Rol</label>
                <select id="select-role" name="role" value={form.role} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border, #334155)', background: 'var(--bg-input, #0f172a)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                  <option value="org_admin">Admin de Organización</option>
                  <option value="operator">Operador</option>
                  <option value="viewer">Viewer (Solo lectura)</option>
                  {/* super_admin NO aparece aquí intencionalmente */}
                </select>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  El rol <strong>Super Admin</strong> solo puede asignarse directamente en Firestore.
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID de Organización <span style={{ opacity: 0.6 }}>(opcional)</span></label>
                <input id="input-org-id" name="organizationId" value={form.organizationId} onChange={handleChange} placeholder="Ej: org_12345"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border, #334155)', background: 'var(--bg-input, #0f172a)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid var(--border, #334155)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                  Cancelar
                </button>
                <button id="btn-submit-user" type="submit" disabled={submitting}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando usuarios...</div>
      ) : (
        <div style={{ background: 'var(--bg-card, #1e293b)', borderRadius: '16px', border: '1px solid var(--border, rgba(255,255,255,0.08))', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
                {['Usuario', 'Email', 'Rol', 'Organización', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const roleInfo = ROLE_LABELS[u.role] || { label: u.role, color: '#94a3b8' };
                const initials = (u.name || u.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id || i} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>{initials}</div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{u.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.email}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: `${roleInfo.color}22`, color: roleInfo.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${roleInfo.color}44` }}>
                        {u.role === 'super_admin' ? '⚡ Super Admin' : roleInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.org_name || '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {u.status === 'active' ? 'Activo' : u.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay usuarios registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
