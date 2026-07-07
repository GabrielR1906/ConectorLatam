import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Login from './pages/Login';
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';

// Client Views
import Dashboard from './pages/client/Dashboard';
import Wizard from './pages/client/Wizard';
import Logs from './pages/client/Logs';
import Pricing from './pages/client/Pricing';
import ApiDocs from './pages/client/ApiDocs';

// Admin Views (solo super_admin — equipo ConectorLatam)
import ApiHealth from './pages/admin/ApiHealth';
import Alerts from './pages/admin/Alerts';
import Metrics from './pages/admin/Metrics';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* ── Rutas de Cliente ─────────────────────────────────────────────
              Accesibles por: org_admin, operator, viewer
              Un super_admin que intente entrar aquí será redirigido a /admin */}
          <Route path="/client" element={
            <RoleRoute
              allowedRoles={['org_admin', 'operator', 'viewer']}
              fallback="/admin/apis"
            >
              <ClientLayout />
            </RoleRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="wizard" element={
              <RoleRoute allowedRoles={['org_admin']} fallback="/client/dashboard">
                <Wizard />
              </RoleRoute>
            } />
            <Route path="logs" element={<Logs />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="api-docs" element={<ApiDocs />} />
          </Route>

          {/* ── Rutas de Plataforma (Admin) ───────────────────────────────────
              Accesibles SOLO por: super_admin (equipo ConectorLatam)
              Un cliente que intente entrar será redirigido a /client/dashboard */}
          <Route path="/admin" element={
            <RoleRoute
              allowedRoles={['super_admin']}
              fallback="/client/dashboard"
            >
              <AdminLayout />
            </RoleRoute>
          }>
            <Route index element={<Navigate to="apis" replace />} />
            <Route path="apis" element={<ApiHealth />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="metrics" element={<Metrics />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

