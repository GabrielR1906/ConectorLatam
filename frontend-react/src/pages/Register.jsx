import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from 'lucide-react';

const API_URL = 'https://conectorlatam-backend.onrender.com/api';

export default function Register() {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    orgName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }
    
    try {
      setError('');
      setLoading(true);

      // 1. Llamar al backend para registrar al usuario.
      // Creamos un endpoint público para auto-registro que asigna automáticamente
      // el rol "org_admin" y crea la organización.
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      // 2. Iniciar sesión automáticamente en Firebase con las credenciales creadas
      await login(form.email, form.password);

      // 3. Redirigir al cliente a su dashboard
      setTimeout(() => {
        navigate('/client/dashboard');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Fallo al registrarse. Inténtalo de nuevo.');
      console.error(err);
      setLoading(false);
    }
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
            <span className="ps-tagline">Registro de Cliente</span>
          </div>
        </div>

        <div className="wizard-card" style={{ width: '100%' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Crear una cuenta</h2>
          
          {error && <div className="badge badge--error" style={{ marginBottom: '15px', padding: '10px', display: 'block', textAlign: 'center' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input 
                name="displayName"
                type="text" 
                className="form-input" 
                placeholder="Juan Pérez"
                value={form.displayName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Empresa / Organización</label>
              <input 
                name="orgName"
                type="text" 
                className="form-input" 
                placeholder="Mi Empresa S.A."
                value={form.orgName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input 
                name="email"
                type="email" 
                className="form-input" 
                placeholder="ejemplo@empresa.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input 
                name="password"
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ marginTop: '10px', justifyContent: 'center' }}
            >
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Inicia sesión aquí</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
