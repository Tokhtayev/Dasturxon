import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MIN_FULL_NAME_LENGTH } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import { formatContactPhoneDisplay, isValidContactPhone } from '../../services/validators';

const ProfileEditFields: React.FC<{
  nameInput: string;
  onNameChange: (v: string) => void;
  phoneInput: string;
  onPhoneChange: (v: string) => void;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}> = ({ nameInput, onNameChange, phoneInput, onPhoneChange, saving, onCancel, onSave }) => (
  <div className="space-y-2 max-w-xs mx-auto text-left">
    <input
      type="text"
      value={nameInput}
      onChange={(e) => onNameChange(e.target.value)}
      placeholder="To‘liq ism"
      className="w-full px-3 py-2 rounded-xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <input
      type="tel"
      value={phoneInput}
      onChange={(e) => onPhoneChange(e.target.value)}
      placeholder="+998 90 123 45 67"
      className="w-full px-3 py-2 rounded-xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <div className="flex justify-end gap-2">
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer"
        style={{ borderColor: 'var(--dx-border)' }}
      >
        Bekor qilish
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
        style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
      >
        Saqlash
      </button>
    </div>
  </div>
);

export const CustomerProfilePage: React.FC = () => {
  const { session, updateFullName, updatePhone, signOut } = useAuth();
  const profile = session.status === 'ready' ? session.profile : null;

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.fullName ?? '');
  const [phoneInput, setPhoneInput] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!profile) return null;

  const displayPhone = formatContactPhoneDisplay(profile.phone);

  const handleSave = async () => {
    setMsg(null);
    setErrMsg(null);
    if (nameInput.trim().length < MIN_FULL_NAME_LENGTH) {
      setErrMsg('Ism kamida 2 belgidan iborat bo‘lsin.');
      return;
    }
    if (phoneInput.trim() && !isValidContactPhone(phoneInput)) {
      setErrMsg('Telefon raqamini to‘liq kiriting (masalan: +998 90 123 45 67).');
      return;
    }

    setSaving(true);
    try {
      await updateFullName(nameInput);
      await updatePhone(phoneInput);
      setEditing(false);
      setMsg('Profil ma’lumotlari yangilandi.');
    } catch (err) {
      setErrMsg(getReadableErrorMessage(err, 'Xatolik yuz berdi.'));
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
          <ProfileEditFields
            nameInput={nameInput}
            onNameChange={setNameInput}
            phoneInput={phoneInput}
            onPhoneChange={setPhoneInput}
            saving={saving}
            onCancel={() => setEditing(false)}
            onSave={() => void handleSave()}
          />
        ) : (
          <div>
            <h1 className="font-display text-xl font-bold">{profile.fullName}</h1>
            <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
              @{profile.normalizedNickname} · {profile.email}
            </p>
            <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--dx-muted)' }}>
              📞 {displayPhone || 'Telefon raqami kiritilmagan'}
            </p>
            <button
              type="button"
              onClick={() => {
                setNameInput(profile.fullName);
                setPhoneInput(profile.phone || '+998 ');
                setErrMsg(null);
                setEditing(true);
              }}
              className="mt-2 text-xs font-bold cursor-pointer"
              style={{ color: 'var(--dx-primary)' }}
            >
              Profilni tahrirlash
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

        {errMsg && (
          <div className="text-xs font-bold" style={{ color: 'var(--dx-error)' }}>
            {errMsg}
          </div>
        )}
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
