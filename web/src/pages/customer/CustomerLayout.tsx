import React from 'react';
import { Outlet } from 'react-router-dom';
import { Boxes, Clock, ShoppingBag, User } from 'lucide-react';
import { AppShell } from '../../components/AppShell';

interface CustomerLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ isDark, onToggleTheme }) => {
  return (
    <AppShell
      roleBadge="🛒 Mijoz"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      navItems={[
        { to: '/feed', label: 'Mahsulotlar', icon: <ShoppingBag className="w-4 h-4" /> },
        { to: '/wholesale', label: 'Optom', icon: <Boxes className="w-4 h-4" /> },
        { to: '/orders', label: 'Buyurtmalarim', icon: <Clock className="w-4 h-4" /> },
        { to: '/profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
      ]}
    >
      <Outlet />
    </AppShell>
  );
};
