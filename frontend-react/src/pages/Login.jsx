import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, userProfile } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);

      // La redirección se hace automáticamente por el RoleRoute en base a los roles,
      // pero aquí hacemos la redirección inicial según lo que devuelva el context.
      // Damos 500ms para asegurar que el token se validó en el backend.
      setTimeout(() => {
        navigate('/client/dashboard');
      }, 500);
    } catch (err) {
      setError('Fallo al iniciar sesión. Revisa tus credenciales.');
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="portal-selector-screen">
      <div className="ps-bg"></div>
      <div className="ps-content" style={{ maxWidth: '400px' }}>
        <div className="ps-logo">
          <div className="brand-logo" style={{ width: '48px', height: '48px' }}>
            <Activity color="#fff" size={24} />
          </div>
          <div className="brand-text">
            <span className="ps-brand" style={{ fontSize: '1.4rem' }}>ConectorLatam</span>
            <span className="ps-tagline">Auth Portal</span>
          </div>
        </div>

        <div className="wizard-card" style={{ width: '100%' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Iniciar Sesión</h2>
          
          {error && <div className="badge badge--error" style={{ marginBottom: '15px', padding: '10px', display: 'block', textAlign: 'center' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ marginTop: '10px', justifyContent: 'center' }}
            >
              {loading ? 'Cargando...' : 'Entrar al Dashboard'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Regístrate aquí</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
