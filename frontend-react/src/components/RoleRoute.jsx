import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * RoleRoute — Protege una ruta verificando que el usuario tenga
 * uno de los roles permitidos. Si no está autenticado, redirige a /login.
 * Si está autenticado pero no tiene el rol, redirige a la ruta indicada
 * por `fallback` (por defecto al dashboard de cliente).
 *
 * Uso:
 *   <RoleRoute allowedRoles={['super_admin']}>
 *     <AdminPage />
 *   </RoleRoute>
 */
export default function RoleRoute({ children, allowedRoles, fallback = '/client/dashboard' }) {
  const { currentUser, userProfile } = useAuth();

  // No autenticado → al login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero perfil todavía cargando → nada
  if (!userProfile) {
    return null;
  }

  // Tiene el rol permitido → mostrar la ruta
  if (allowedRoles.includes(userProfile.role)) {
    return children;
  }

  // Autenticado pero sin el rol → redirigir
  return <Navigate to={fallback} replace />;
}
