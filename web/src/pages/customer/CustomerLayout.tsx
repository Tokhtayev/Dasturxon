import React from 'react';
import { Outlet } from 'react-router-dom';
import { Clock, ShoppingBag, User } from 'lucide-react';
import { AppShell } from '../../components/AppShell';

interface CustomerLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ isDark, onToggleTheme }) => {
  return (
    <AppShell
      roleBadge="🛒 Xaridor"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      navItems={[
        { to: '/customer/feed', label: 'Mahsulotlar', icon: <ShoppingBag className="w-4 h-4" /> },
        { to: '/customer/orders', label: 'Buyurtmalarim', icon: <Clock className="w-4 h-4" /> },
        { to: '/customer/profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
      ]}
    >
      <Outlet />
    </AppShell>
  );
};
