import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnlyGuard, RoleGuard } from './components/RouteGuards';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WelcomePage } from './pages/WelcomePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { CustomerFeedPage } from './pages/customer/CustomerFeedPage';
import { CustomerLayout } from './pages/customer/CustomerLayout';
import { CustomerOrdersPage } from './pages/customer/CustomerOrdersPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { OwnerAnalyticsPage } from './pages/owner/OwnerAnalyticsPage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerLayout } from './pages/owner/OwnerLayout';
import { OwnerOrdersPage } from './pages/owner/OwnerOrdersPage';
import { OwnerProductsPage } from './pages/owner/OwnerProductsPage';

export function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark((d) => !d);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<GuestOnlyGuard />}>
            <Route path="/" element={<WelcomePage isDark={isDark} onToggleTheme={toggleTheme} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RoleGuard allowedRole="customer" />}>
            <Route
              path="/customer"
              element={<CustomerLayout isDark={isDark} onToggleTheme={toggleTheme} />}
            >
              <Route index element={<Navigate to="/customer/feed" replace />} />
              <Route path="feed" element={<CustomerFeedPage />} />
              <Route path="orders" element={<CustomerOrdersPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
            </Route>
          </Route>

          <Route element={<RoleGuard allowedRole="owner" />}>
            <Route
              path="/owner"
              element={<OwnerLayout isDark={isDark} onToggleTheme={toggleTheme} />}
            >
              <Route index element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboardPage />} />
              <Route path="products" element={<OwnerProductsPage />} />
              <Route path="orders" element={<OwnerOrdersPage />} />
              <Route path="analytics" element={<OwnerAnalyticsPage />} />
            </Route>
          </Route>

          <Route element={<RoleGuard allowedRole="admin" />}>
            <Route
              path="/admin"
              element={<AdminLayout isDark={isDark} onToggleTheme={toggleTheme} />}
            >
              <Route index element={<Navigate to="/admin/approvals" replace />} />
              <Route path="approvals" element={<AdminDashboardPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
