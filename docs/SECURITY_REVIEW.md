# Dasturxon Static Security Review

## 1. Executive Summary
This document provides a static security review of the Dasturxon Android application (`com.example.dasturxon`) and associated Firebase security configurations, following OWASP Mobile Application Security Verification Standard (MASVS) and Android platform security guidelines.

The review targeted six critical security areas:
1. Exported application components and IPC attack surface
2. Cleartext network traffic and TLS enforcement
3. Application backup and data extraction controls
4. Debuggable flags and release build hardening
5. Hardcoded credentials, API keys, tokens, and backdoors
6. Personally Identifiable Information (PII) leakage in logs

---

## 2. Findings & Remediations Matrix

| Category | Finding / Risk | Status | Remediation Applied |
| :--- | :--- | :--- | :--- |
| **Exported Components** | Implicit component exposure allowing unintended invocation or hijacking. | **Secured** | `MainActivity` is the sole declared activity, explicitly marked `android:exported="true"` solely for `MAIN` + `LAUNCHER` intent-filter. No unexported or unprotected services, receivers, or content providers exist. |
| **Cleartext Traffic** | Unencrypted HTTP communication susceptible to eavesdropping and MITM. | **Secured** | Configured `android:usesCleartextTraffic="false"` in `AndroidManifest.xml` and enforced `@xml/network_security_config` with `<base-config cleartextTrafficPermitted="false">` trusting only system CAs. |
| **Backup & Data Extraction** | Unencrypted ADB or cloud backup leaking stored auth tokens, session state, and local preferences. | **Secured** | Enforced `android:allowBackup="false"` in manifest; locked down `@xml/data_extraction_rules` (cloud-backup & device-transfer) and `@xml/backup_rules` (full-backup-content) to exclude `root`, `file`, `database`, and `sharedpref`. |
| **Debuggable Flag** | Production builds left debuggable allowing runtime code injection and debugger attachment. | **Secured** | Verified `android:debuggable` is absent from `AndroidManifest.xml`. Release build type preserves AGP default (`isDebuggable = false`) with code optimization enabled. |
| **Hardcoded Secrets** | Embedded API keys, secret credentials, OTP bypasses, or testing backdoors. | **Secured** | Automated codebase scanning confirmed absence of hardcoded passwords, private keys, client secrets, or authentication tokens. All authentication is delegated to Firebase Auth and Google Credential Manager. |
| **PII in Logging** | Exception stack traces or auth responses logging usernames, phone numbers, or tokens to Logcat. | **Secured** | Sanitized Google Credential Manager catch blocks in `AuthScreens.kt` to omit exception objects/traces from logs (`Log.w` with generic messages). No other `Log.*` or `println` calls exist in production code. |
| **Database Rules** | Unauthorized data tampering, privilege escalation, cross-tenant order/product access. | **Secured** | Enforced least-privilege `firestore.rules`: user role immutability on update, unapproved business product creation block, cross-owner update block, customer order isolation. Verified by 17 automated emulator tests. |

---

## 3. Detailed Component Review

### 3.1 Android Manifest & Component Security
- **Manifest Location**: `app/src/main/AndroidManifest.xml`
- **Component Analysis**:
  - `com.example.dasturxon.MainActivity`:
    - `android:exported="true"`: Required because it defines `<category android:name="android.intent.category.LAUNCHER" />`.
    - No exported deep links or custom intent schemes without validation.
  - No `<service>`, `<receiver>`, or `<provider>` tags exist in the manifest, eliminating background broadcast spoofing and database provider leakage risks.

### 3.2 Network Security
- **Manifest Attributes**: `android:usesCleartextTraffic="false"`
- **Network Security Config**: `app/src/main/res/xml/network_security_config.xml`
  - All plain HTTP requests are blocked at the platform networking layer.
  - Custom / user-added CA certificates are rejected by default, preventing interception via user-installed proxy certificates unless explicitly targeted in a debug-only override.

### 3.3 Data Storage & Backup Controls
- **Backup Flag**: `android:allowBackup="false"`
- **Extraction Rules** (`app/src/main/res/xml/data_extraction_rules.xml`):
  - Excludes all internal domains (`sharedpref`, `database`, `file`, `root`) from both cloud backup and device-to-device migration.
- **Legacy Backup Rules** (`app/src/main/res/xml/backup_rules.xml`):
  - Excludes all domains for backward compatibility with pre-API 31 devices.
- **Local Credentials**: DataStore preferences and Firebase auth tokens cannot be harvested via `adb backup`.

### 3.4 Hardcoded Secrets & Backdoor Audit
- Full regex search for tokens, passwords, and private keys executed across all source files.
- Zero private keys, hardcoded OTPs, or master passwords exist in the application code.
- Auth flow uses strict Firebase Auth SDK APIs and Google Play Services Credential Manager.

### 3.5 Logcat and PII Audit
- Identified and eliminated detailed exception stack traces in `AuthScreens.kt`.
- Verified that sensitive customer/owner fields (email, phone, fullName, tokens) are never formatted into `Log.*` statements or standard output streams.

---

## 4. Verification & Automated Testing
The fixes and baseline security controls were verified using the following automated tools:

1. **Firestore Rules Emulator Testing**:
   - `npm run test:rules` (17 tests total):
     - Role escalation prevention on create and update.
     - Writing to another user's document prevention.
     - Reading other customers' orders prevention.
     - Cross-owner product modification prevention.
     - Real-time snapshot listener integrity tests.
2. **JVM Unit Tests**:
   - `./gradlew testDebugUnitTest`:
     - 44 tests passed (Auth error mapping, Anti-enumeration on password reset, ViewModel validation, Customer orders real-time flow and state handling).
3. **Android Lint**:
   - `./gradlew lintDebug`:
     - Clean, zero fatal warnings or security-related lint errors.
4. **Assembly**:
   - `./gradlew assembleDebug`:
     - Successful compilation and packaging.

---

## 5. Known Limitations & Recommendations
1. **Firebase Spark Tier Limits**: Because Cloud Functions are unavailable on the Spark plan, product inventory decrement and order creation rely on client-side Firestore multi-document transactions. While rules enforce business approval and order integrity, high-concurrency race conditions require server-side triggers for enterprise scale.
2. **Client-Side Search**: Feed filtering is evaluated locally over active product snapshot streams.
