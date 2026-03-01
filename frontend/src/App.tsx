import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Starlink from './pages/Starlink';
import Ticketsystem from './pages/Ticketsystem';
import Firewalls from './pages/Firewalls';
import Websites from './pages/Websites';
import UserManagement from './pages/UserManagement';
import SystemManagement from './pages/SystemManagement';
// import Asana from './pages/Asana';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/starlink"
          element={
            <ProtectedRoute>
              <Layout>
                <Starlink />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ticketsystem"
          element={
            <ProtectedRoute>
              <Layout>
                <Ticketsystem />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/firewalls"
          element={
            <ProtectedRoute>
              <Layout>
                <Firewalls />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/websites"
          element={
            <ProtectedRoute>
              <Layout>
                <Websites />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Asana Integration deaktiviert
        <Route
          path="/asana"
          element={
            <ProtectedRoute>
              <Layout>
                <Asana />
              </Layout>
            </ProtectedRoute>
          }
        />
        */}

        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/system-management"
          element={
            <ProtectedRoute>
              <Layout>
                <SystemManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
