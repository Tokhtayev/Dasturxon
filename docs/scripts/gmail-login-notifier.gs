/**
 * Dasturxon — Gmail Login Notification Webhook (Google Apps Script)
 *
 * 100% BEPUL: Google Workspace / oddiy @gmail.com hisobingizda ishlaydi.
 * Sozlash tartibi:
 * 1. https://script.google.com sahifasiga kiring va "New project" (Yangi loyiha) yarating.
 * 2. Ushbu fayl kodini Code.gs ichiga to'liq nusxalab joylang.
 * 3. Deploy -> New deployment -> Web app:
 *    - Execute as: Me (o'zingizning Gmailingiz)
 *    - Who has access: Anyone (Hamma)
 * 4. Ruxsat so'raganda "Advanced -> Go to ... (unsafe) -> Allow" qiling.
 * 5. Chiqqan `https://script.google.com/macros/s/.../exec` havolasini
 *    Dasturxon -> /#/admin ("Gmail bildirishnoma sozlamasi") bo'limiga saqlang.
 */

var FIREBASE_PROJECT_ID = 'dasturxon-27a6e';
var DEDUPE_SECONDS = 60;

var ROLE_LABELS = {
  customer: 'Mijoz',
  owner: 'Biznes egasi',
  admin: 'Administrator',
};

function decodeJwtPayload(idToken) {
  var parts = String(idToken || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid Firebase token');
  }
  var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  var bytes = Utilities.base64Decode(b64);
  return JSON.parse(Utilities.newBlob(bytes).getDataAsString('UTF-8'));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fetchVerifiedProfile(idToken, uid) {
  var url =
    'https://firestore.googleapis.com/v1/projects/' +
    FIREBASE_PROJECT_ID +
    '/databases/(default)/documents/users/' +
    encodeURIComponent(uid);

  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + idToken },
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() !== 200) {
    throw new Error('Firebase token or Firestore verification failed: ' + resp.getResponseCode());
  }

  var doc = JSON.parse(resp.getContentText());
  var fields = doc.fields || {};
  return {
    email: (fields.email && fields.email.stringValue) || '',
    role: (fields.role && fields.role.stringValue) || 'customer',
    fullName: (fields.fullName && fields.fullName.stringValue) || 'Foydalanuvchi',
  };
}

function jsonReply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet() {
  return jsonReply({ ok: true, service: 'dasturxon-gmail-notifier' });
}

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var idToken = String(payload.idToken || '');
    var claims = decodeJwtPayload(idToken);
    var uid = String(claims.user_id || claims.sub || '');

    if (!uid || claims.aud !== FIREBASE_PROJECT_ID) {
      return jsonReply({ ok: false, error: 'Unauthorized project or token' });
    }

    var profile = fetchVerifiedProfile(idToken, uid);
    if (!profile.email || /\.(test|example|invalid|localhost)$/i.test(profile.email)) {
      return jsonReply({ ok: true, skipped: true });
    }

    var cache = CacheService.getScriptCache();
    var dedupeKey = 'signin_' + uid;
    if (cache.get(dedupeKey)) {
      return jsonReply({ ok: true, deduped: true });
    }
    cache.put(dedupeKey, '1', DEDUPE_SECONDS);

    var roleUz = ROLE_LABELS[profile.role] || 'Foydalanuvchi';
    var methodUz =
      payload.loginMethod === 'google' ? 'Google (Gmail) hisobi' : 'Email va parol';
    var timeStr = Utilities.formatDate(new Date(), 'Asia/Tashkent', 'yyyy-MM-dd HH:mm');

    var subject = 'Dasturxon — ' + roleUz + ' sifatida tizimga kirdingiz';
    var plainBody =
      'Assalomu alaykum, ' +
      profile.fullName +
      '!\n\n' +
      'Siz ' +
      profile.email +
      ' manzili (' +
      methodUz +
      ') orqali Dasturxon tizimiga ' +
      roleUz +
      ' sifatida muvaffaqiyatli kirdingiz.\n' +
      'Vaqt (Toshkent): ' +
      timeStr +
      '\n\n' +
      'Sayt: https://tokhtayev.github.io/Dasturxon/\n' +
      "Agar bu kirishni siz amalga oshirmagan bo'lsangiz, iltimos parolingizni zudlik bilan almashtiring.";

    var htmlBody =
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:20px;border:1px solid #eadfce;border-radius:16px;background:#fffaf3;color:#2b1d12;">' +
      '<h2 style="margin:0 0 12px;color:#b7500a;">Dasturxon — Tizimga kirish xabarnomasi</h2>' +
      '<p style="margin:0 0 12px;">Assalomu alaykum, <strong>' +
      escapeHtml(profile.fullName) +
      '</strong>!</p>' +
      '<p style="margin:0 0 12px;">Siz <strong>' +
      escapeHtml(profile.email) +
      '</strong> (' +
      escapeHtml(methodUz) +
      ') orqali Dasturxon tizimiga <strong>' +
      escapeHtml(roleUz) +
      '</strong> sifatida muvaffaqiyatli kirdingiz.</p>' +
      '<p style="margin:0 0 16px;font-size:13px;color:#6e5a49;">Vaqt (Toshkent): ' +
      escapeHtml(timeStr) +
      '</p>' +
      '<a href="https://tokhtayev.github.io/Dasturxon/" style="display:inline-block;padding:10px 18px;border-radius:10px;background:#b7500a;color:#ffffff;text-decoration:none;font-weight:bold;">Dasturxonni ochish</a>' +
      '<p style="margin:16px 0 0;font-size:12px;color:#8a7766;">Agar bu kirishni siz qilmagan bo‘lsangiz, hisobingiz xavfsizligini tekshiring.</p>' +
      '</div>';

    MailApp.sendEmail({
      to: profile.email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: 'Dasturxon — Mahalla Bozori',
    });

    return jsonReply({ ok: true, sent: true });
  } catch (err) {
    return jsonReply({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
