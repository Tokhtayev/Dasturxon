import React from 'react';
import { Outlet } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Package, TrendingUp } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { OwnerBusinessGate } from './OwnerBusinessGate';

export type OwnerContextType = ReturnType<typeof useOwnerDashboard>;

interface OwnerLayoutProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ isDark, onToggleTheme }) => {
  const { session } = useAuth();
  const uid = session.status === 'ready' ? session.profile.uid : undefined;
  const ownerState = useOwnerDashboard(uid);

  const isApproved = ownerState.business?.status === 'approved';

  return (
    <AppShell
      roleBadge="🏪 Biznes egasi"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      navItems={
        isApproved
          ? [
              {
                to: '/owner/dashboard',
                label: 'Boshqaruv',
                icon: <LayoutDashboard className="w-4 h-4" />,
              },
              {
                to: '/owner/products',
                label: 'Mahsulotlar',
                icon: <Package className="w-4 h-4" />,
              },
              {
                to: '/owner/orders',
                label: 'Buyurtmalar',
                icon: <ClipboardList className="w-4 h-4" />,
              },
              {
                to: '/owner/analytics',
                label: 'Analitika',
                icon: <TrendingUp className="w-4 h-4" />,
              },
            ]
          : [
              {
                to: '/owner/dashboard',
                label: 'Biznes profili',
                icon: <LayoutDashboard className="w-4 h-4" />,
              },
            ]
      }
    >
      {!ownerState.businessesLoaded ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--dx-muted)' }}>
          Biznes ma’lumotlari yuklanmoqda…
        </div>
      ) : !isApproved ? (
        <OwnerBusinessGate
          business={ownerState.business}
          onCreateBusiness={ownerState.createBusiness}
          onResubmitBusiness={ownerState.resubmitBusiness}
        />
      ) : (
        <Outlet context={ownerState} />
      )}
    </AppShell>
  );
};
