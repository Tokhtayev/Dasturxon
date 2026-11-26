import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnlyGuard, RoleGuard } from './components/RouteGuards';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage key="login" initialTab="login" />} />
            <Route path="/register" element={<RegisterPage key="register" />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>

          <Route element={<RoleGuard allowedRole="customer" />}>
            <Route element={<CustomerLayout isDark={isDark} onToggleTheme={toggleTheme} />}>
              <Route path="/feed" element={<CustomerFeedPage />} />
              <Route path="/orders" element={<CustomerOrdersPage />} />
              <Route path="/profile" element={<CustomerProfilePage />} />
              <Route path="/customer/*" element={<Navigate to="/feed" replace />} />
            </Route>
          </Route>

          <Route element={<RoleGuard allowedRole="owner" />}>
            <Route
              path="/owner"
              element={<OwnerLayout isDark={isDark} onToggleTheme={toggleTheme} />}
            >
              <Route index element={<OwnerDashboardPage />} />
              <Route path="products" element={<OwnerProductsPage />} />
              <Route path="orders" element={<OwnerOrdersPage />} />
              <Route path="analytics" element={<OwnerAnalyticsPage />} />
              <Route path="dashboard" element={<Navigate to="/owner" replace />} />
            </Route>
          </Route>

          <Route element={<RoleGuard allowedRole="admin" />}>
            <Route
              path="/admin"
              element={<AdminLayout isDark={isDark} onToggleTheme={toggleTheme} />}
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="approvals" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
