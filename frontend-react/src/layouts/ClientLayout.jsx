import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ClientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userProfile, currentUser } = useAuth();

  // Nombre real: primero del perfil del backend, luego de Firebase, luego fallback
  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Usuario';
  const userRole = userProfile?.role || 'org_admin';

  // Rol en español para mostrar en la UI
  const roleLabel = {
    org_admin: 'Administrador',
    operator: 'Operador',
    viewer: 'Solo Lectura',
    super_admin: 'Super Admin'
  }[userRole] || 'Usuario';

  // Calcular iniciales del avatar
  const getInitials = (name) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  const avatarInitials = getInitials(displayName);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const handleNav = (path) => {
    navigate(path);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/client/dashboard': return 'Mis Conexiones Fiscales';
      case '/client/wizard': return 'Nueva Conexión Fiscal';
      case '/client/logs': return 'Historial y Logs';
      case '/client/pricing': return 'Planes y Precios';
      case '/client/api-docs': return 'Documentación API';
      default: return 'Portal Cliente';
    }
  };

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/client/dashboard': return 'Mis Conexiones';
      case '/client/wizard': return 'Nueva Conexión';
      case '/client/logs': return 'Historial';
      case '/client/pricing': return 'Planes';
      case '/client/api-docs': return 'API Docs';
      default: return '';
    }
  };

  return (
    <div id="portal-client" className="portal">
      <aside className="sidebar" id="sidebar-client">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <path d="M6 16C6 10.477 10.477 6 16 6" stroke="url(#gc1)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M26 16C26 21.523 21.523 26 16 26" stroke="url(#gc2)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="16" cy="16" r="4" fill="url(#gc3)"/>
              <path d="M16 6V2M16 30v-4M6 16H2M30 16h-4" stroke="url(#gc1)" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="gc1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#a855f7"/></linearGradient>
                <linearGradient id="gc2" x1="32" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#06b6d4"/><stop offset="1" stopColor="#6366f1"/></linearGradient>
                <radialGradient id="gc3" cx="50%" cy="50%" r="50%"><stop stopColor="#a855f7"/><stop offset="1" stopColor="#6366f1"/></radialGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">ConectorLatam</span>
            <span className="brand-tag">Portal Cliente</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Mis Datos Fiscales</div>
          <a href="#" className={`nav-item ${location.pathname.includes('dashboard') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('dashboard'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
            <span>Mis Conexiones</span>
          </a>
          <a href="#" className={`nav-item ${location.pathname.includes('wizard') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('wizard'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <span>Nueva Conexión</span>
          </a>
          <a href="#" className={`nav-item ${location.pathname.includes('logs') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('logs'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><line x1="6" y1="8" x2="10" y2="8"/><line x1="6" y1="11" x2="14" y2="11"/></svg>
            <span>Historial y Logs</span>
          </a>
          <div className="nav-section-label" style={{marginTop: '12px'}}>Mi Cuenta</div>
          <a href="#" className={`nav-item ${location.pathname.includes('pricing') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('pricing'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span>Planes y Precios</span>
          </a>
          <a href="#" className={`nav-item ${location.pathname.includes('api-docs') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('api-docs'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>
            <span>API Docs</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="org-selector">
            <select className="form-select-sm" defaultValue="org-001" style={{width: '100%', marginBottom: '6px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '.65rem', fontFamily: 'inherit'}}>
              <option value="org-001">Corporación Demo LATAM S.A.</option>
              <option value="org-002">Grupo Industrial Norte S.A. de C.V.</option>
              <option value="org-003">Importaciones del Pacífico S.R.L.</option>
            </select>
          </div>
          <div className="plan-chip">
            <span className="plan-chip-dot"></span>
            <span>Plan Growth · 14 días trial</span>
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">{avatarInitials}</div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{roleLabel}</span>
            </div>
            <div className="status-dot"></div>
          </div>
          <button className="btn-switch-portal" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">{getPageTitle()}</h1>
            <div className="breadcrumb">
              <span>ConectorLatam</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M9 18l6-6-6-6"/></svg>
              <span>{getBreadcrumb()}</span>
            </div>
          </div>
          <div className="header-right">
            <button className="btn btn-ghost btn-icon tut-help-btn" title="Ver tutorial interactivo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </button>
            <button className="btn btn-ghost btn-icon" title="Configuración de Cuenta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <div className="header-divider"></div>
            <div className="header-time">{new Date().toISOString().substring(0, 10)}</div>
            <div className="live-badge"><span className="live-dot"></span><span>LIVE</span></div>
            <button className="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Ejecutar Pipeline
            </button>
          </div>
        </header>
        
        {/* The current view will be rendered here via Outlet */}
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;
