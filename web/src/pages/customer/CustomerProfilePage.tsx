import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const CustomerProfilePage: React.FC = () => {
  const { session, updateFullName, signOut } = useAuth();
  const profile = session.status === 'ready' ? session.profile : null;

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!profile) return null;

  const handleSave = async () => {
    if (nameInput.trim().length < 2) return;
    setSaving(true);
    setMsg(null);
    try {
      await updateFullName(nameInput);
      setEditing(false);
      setMsg('Profil ismi yangilandi.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div
        className="rounded-3xl p-6 border text-center space-y-3"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-extrabold"
          style={{
            backgroundColor: 'var(--dx-primary-container)',
            color: 'var(--dx-on-primary-container)',
          }}
        >
          {(profile.fullName || profile.email).slice(0, 1).toUpperCase()}
        </div>

        {editing ? (
          <div className="flex items-center gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              Saqlash
            </button>
          </div>
        ) : (
          <div>
            <h1 className="font-display text-xl font-bold">{profile.fullName}</h1>
            <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
              @{profile.normalizedNickname} · {profile.email}
            </p>
            <button
              type="button"
              onClick={() => {
                setNameInput(profile.fullName);
                setEditing(true);
              }}
              className="mt-2 text-xs font-bold cursor-pointer"
              style={{ color: 'var(--dx-primary)' }}
            >
              Ismni tahrirlash
            </button>
          </div>
        )}

        <div className="pt-1">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--dx-primary-container)',
              color: 'var(--dx-on-primary-container)',
            }}
          >
            🛒 Xaridor
          </span>
        </div>

        {msg && (
          <div className="text-xs font-bold" style={{ color: 'var(--dx-tertiary)' }}>
            {msg}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void signOut()}
        className="w-full py-3 rounded-2xl text-sm font-bold cursor-pointer"
        style={{
          backgroundColor: 'var(--dx-error-container)',
          color: 'var(--dx-on-error-container)',
        }}
      >
        Hisobdan chiqish
      </button>
    </div>
  );
};
