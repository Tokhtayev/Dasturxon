import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRoleHomePath } from '../services/routing';
import type { UserRole } from '../types/domain';

export const RoleGuard: React.FC<{ allowedRole: UserRole }> = ({ allowedRole }) => {
  const { session, signOut } = useAuth();

  if (session.status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--dx-primary)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-semibold" style={{ color: 'var(--dx-muted)' }}>
          Hisob ma’lumotlari yuklanmoqda…
        </p>
      </div>
    );
  }

  if (session.status === 'signed_out') {
    return <Navigate to="/login" replace />;
  }

  if (session.status === 'profile_missing' || session.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="max-w-md w-full rounded-3xl p-6 border space-y-4 text-center"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="text-3xl">⚠️</div>
          <h2 className="font-display text-xl font-bold">
            {session.status === 'profile_missing'
              ? 'Foydalanuvchi profili topilmadi'
              : 'Sessiyada xatolik yuz berdi'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--dx-muted)' }}>
            {session.status === 'profile_missing'
              ? `${session.email} uchun Firestore users/{uid} hujjati mavjud emas.`
              : session.message}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full py-3 rounded-2xl text-sm font-bold cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            Chiqish
          </button>
        </div>
      </div>
    );
  }

  if (session.profile.role !== allowedRole) {
    return <Navigate to={getRoleHomePath(session.profile.role)} replace />;
  }

  return <Outlet />;
};

export const GuestOnlyGuard: React.FC = () => {
  const { session } = useAuth();

  if (session.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-9 h-9 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--dx-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (session.status === 'ready') {
    return <Navigate to={getRoleHomePath(session.profile.role)} replace />;
  }

  return <Outlet />;
};
