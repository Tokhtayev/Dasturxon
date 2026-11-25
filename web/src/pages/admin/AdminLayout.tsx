import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AppShell } from '../../components/AppShell';

interface AdminLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ isDark, onToggleTheme }) => {
  return (
    <AppShell
      roleBadge="🛡️ Administrator"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      navItems={[
        { to: '/admin/approvals', label: 'Tasdiqlar', icon: <ShieldCheck className="w-4 h-4" /> },
      ]}
    >
      <Outlet />
    </AppShell>
  );
};
