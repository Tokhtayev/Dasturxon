import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  getFirebaseAuth,
  getFirebaseDb,
  isEmulatorMode,
  isFirebaseConfigured,
} from '../config/firebase';
import { DEFAULT_LOGIN_EMAIL_WEBHOOK_URL, USER_AGENT_TRUNCATE_LEN } from '../services/constants';
import { isRealDeliverableEmail, isValidAppsScriptWebhookUrl } from '../services/validators';
import type { LoginEmailDeliveryStatus, LoginMethod, UserProfile } from '../types/domain';

const SETTINGS_COLLECTION = 'appSettings';
const NOTIFICATIONS_DOC = 'notifications';

export const loginNotificationRepository = {
  async getEmailWebhookUrl(): Promise<string> {
    if (isValidAppsScriptWebhookUrl(DEFAULT_LOGIN_EMAIL_WEBHOOK_URL)) {
      return DEFAULT_LOGIN_EMAIL_WEBHOOK_URL;
    }
    if (!isFirebaseConfigured) return '';
    try {
      const snap = await getDoc(doc(getFirebaseDb(), SETTINGS_COLLECTION, NOTIFICATIONS_DOC));
      const raw = snap.exists() ? (snap.data().emailWebhookUrl as unknown) : '';
      return typeof raw === 'string' && isValidAppsScriptWebhookUrl(raw) ? raw.trim() : '';
    } catch {
      return '';
    }
  },

  async saveEmailWebhookUrl(rawUrl: string): Promise<string> {
    const trimmed = rawUrl.trim();
    if (trimmed !== '' && !isValidAppsScriptWebhookUrl(trimmed)) {
      throw new Error(
        "Havola https://script.google.com/macros/s/.../exec ko'rinishida bo'lishi kerak."
      );
    }
    await setDoc(
      doc(getFirebaseDb(), SETTINGS_COLLECTION, NOTIFICATIONS_DOC),
      {
        emailWebhookUrl: trimmed,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return trimmed;
  },

  async sendSignInNotificationEmail(params: {
    profile: UserProfile;
    method: LoginMethod;
  }): Promise<LoginEmailDeliveryStatus> {
    if (!isRealDeliverableEmail(params.profile.email)) {
      return 'skipped_test_domain';
    }
    if (!isFirebaseConfigured || isEmulatorMode) {
      return 'skipped_test_domain';
    }

    const webhookUrl = await this.getEmailWebhookUrl();
    if (!webhookUrl) {
      return 'not_configured';
    }

    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser) return 'failed';

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({
          idToken,
          loginMethod: params.method,
          userAgent:
            typeof navigator !== 'undefined'
              ? navigator.userAgent.slice(0, USER_AGENT_TRUNCATE_LEN)
              : '',
        }),
      });
      if (!response.ok) return 'failed';
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        skipped?: boolean;
      } | null;
      if (data && data.ok === false) return 'failed';
      if (data?.skipped) return 'skipped_test_domain';
      return 'sent';
    } catch {
      return 'failed';
    }
  },
};
