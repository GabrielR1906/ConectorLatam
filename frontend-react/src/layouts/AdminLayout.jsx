import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userProfile, currentUser } = useAuth();

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Administrador';

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
      case '/admin/apis':    return 'Estado de APIs Fiscales';
      case '/admin/alerts':  return 'Alertas del Sistema';
      case '/admin/metrics': return 'Métricas Globales';
      case '/admin/users':   return 'Gestión de Usuarios';
      default: return 'Panel Administrador';
    }
  };

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/admin/apis':    return 'APIs Fiscales';
      case '/admin/alerts':  return 'Alertas';
      case '/admin/metrics': return 'Métricas';
      case '/admin/users':   return 'Usuarios';
      default: return '';
    }
  };

  return (
    <div id="portal-admin" className="portal">
      <aside className="sidebar sidebar--admin" id="sidebar-admin">
        <div className="sidebar-brand">
          <div className="brand-logo brand-logo--admin">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">ConectorLatam</span>
            <span className="brand-tag brand-tag--admin">Panel Administrador</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Plataforma</div>
          <a href="#" className={`nav-item ${location.pathname.includes('apis') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('apis'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Estado de APIs</span>
            <span className="nav-badge nav-badge--red">1</span>
          </a>
          <a href="#" className={`nav-item ${location.pathname.includes('alerts') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('alerts'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span>Alertas del Sistema</span>
            <span className="nav-badge nav-badge--red">3</span>
          </a>
          <a href="#" className={`nav-item ${location.pathname.includes('metrics') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('metrics'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>Métricas Globales</span>
          </a>

          <div className="nav-section-label" style={{marginTop: '12px'}}>Clientes</div>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span>Organizaciones</span>
          </a>
          <a href="#" className={`nav-item ${location.pathname.includes('users') ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleNav('users'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Usuarios</span>
          </a>

          <div className="nav-section-label" style={{marginTop: '12px'}}>Finanzas</div>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span>Facturación</span>
          </a>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>Config. de Planes</span>
          </a>

          <div className="nav-section-label" style={{marginTop: '12px'}}>Seguridad</div>
          <a href="#" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Auditoría</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar user-avatar--admin">{avatarInitials}</div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role" style={{color: '#f97316'}}>Super Admin</span>
            </div>
            <div className="status-dot"></div>
          </div>
          <button className="btn-switch-portal btn-switch-portal--admin" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header top-header--admin">
          <div className="header-left">
            <h1 className="page-title">{getPageTitle()}</h1>
            <div className="breadcrumb">
              <span>Admin ConectorLatam</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M9 18l6-6-6-6"/></svg>
              <span>{getBreadcrumb()}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-time">{new Date().toISOString().substring(0, 10)}</div>
            <button className="btn btn-ghost btn-icon tut-help-btn tut-help-btn--admin" title="Ver tutorial del panel admin">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </button>
            <div className="live-badge live-badge--admin"><span className="live-dot"></span><span>ADMIN</span></div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
