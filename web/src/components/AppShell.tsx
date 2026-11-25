import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DxLogo } from './DxLogo';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface AppShellProps {
  title?: string;
  roleBadge: string;
  navItems: NavItem[];
  isDark: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  roleBadge,
  navItems,
  isDark,
  onToggleTheme,
  children,
}) => {
  const { session, emulatorMode, signOut } = useAuth();
  const displayName =
    session.status === 'ready'
      ? session.profile.fullName || session.profile.email
      : '';

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--dx-surface) 92%, transparent)',
          borderColor: 'var(--dx-border)',
        }}
      >
        <div className="suzani-border-strip w-full" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <DxLogo size={34} subtitle="Mahalla Bozori" />
            <span
              className="hidden sm:inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: 'var(--dx-secondary-container)',
                color: 'var(--dx-on-secondary-container)',
              }}
            >
              {roleBadge}
            </span>
            {emulatorMode && (
              <span
                className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border"
                style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-muted)' }}
              >
                Emulator
              </span>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--dx-primary-container)' : 'transparent',
                  color: isActive ? 'var(--dx-on-primary-container)' : 'var(--dx-text)',
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {displayName && (
              <span
                className="hidden lg:inline-block text-xs font-semibold truncate max-w-[140px]"
                style={{ color: 'var(--dx-muted)' }}
              >
                {displayName}
              </span>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Mavzuni almashtirish"
              className="p-2 rounded-xl border cursor-pointer"
              style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-text)' }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Chiqish"
              title="Chiqish"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer"
              style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-error)' }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t px-1.5 py-1.5 grid gap-1 backdrop-blur-md"
        style={{
          gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          backgroundColor: 'color-mix(in srgb, var(--dx-surface) 95%, transparent)',
          borderColor: 'var(--dx-border)',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="py-1.5 px-1 rounded-xl flex flex-col items-center gap-0.5 text-[11px] font-bold transition-colors"
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--dx-primary-container)' : 'transparent',
              color: isActive ? 'var(--dx-on-primary-container)' : 'var(--dx-muted)',
            })}
          >
            {item.icon}
            <span className="truncate max-w-full">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
