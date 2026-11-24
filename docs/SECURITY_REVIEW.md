# Dasturxon Static Security Review

## 1. Executive Summary
This document provides a comprehensive security review and verification of the Dasturxon Android application (`com.example.dasturxon`) and associated Firebase security configurations, following OWASP Mobile Application Security Verification Standard (MASVS) and Android platform security guidelines.

The review targeted eight critical security areas:
1. Exported application components and IPC attack surface
2. Cleartext network traffic and TLS enforcement
3. Application backup and data extraction controls
4. Debuggable flags and release build hardening
5. Hardcoded credentials, API keys, tokens, and backdoors
6. Personally Identifiable Information (PII) leakage in logs
7. Firestore least-privilege security rules and cost isolation
8. Architecture & Dependency Injection hygiene (no direct `FirebaseFirestore.getInstance()` in UI)

---

## 2. Findings & Remediations Matrix

| Category | Finding / Risk | Status | Remediation Applied |
| :--- | :--- | :--- | :--- |
| **Exported Components** | Implicit component exposure allowing unintended invocation or hijacking. | **Secured** | `MainActivity` is the sole declared activity, explicitly marked `android:exported="true"` solely for `MAIN` + `LAUNCHER` intent-filter. No unexported or unprotected services, receivers, or content providers exist. |
| **Cleartext Traffic** | Unencrypted HTTP communication susceptible to eavesdropping and MITM. | **Secured** | Configured `android:usesCleartextTraffic="false"` in `AndroidManifest.xml` and enforced `@xml/network_security_config` with `<base-config cleartextTrafficPermitted="false">` trusting only system CAs. |
| **Backup & Data Extraction** | Unencrypted ADB or cloud backup leaking stored auth tokens, session state, and local preferences. | **Secured** | Enforced `android:allowBackup="false"` in manifest; locked down `@xml/data_extraction_rules` (cloud-backup & device-transfer) and `@xml/backup_rules` (full-backup-content) to exclude `root`, `file`, `database`, and `sharedpref`. |
| **Debuggable Flag** | Production builds left debuggable allowing runtime code injection and debugger attachment. | **Secured** | Verified `android:debuggable` is absent from `AndroidManifest.xml`. Release build type preserves AGP default (`isDebuggable = false`) with code optimization enabled. |
| **Hardcoded Secrets** | Embedded API keys, secret credentials, OTP bypasses, or testing backdoors. | **Secured** | Codebase scanning confirmed absence of hardcoded passwords, private keys, client secrets, or auth tokens. Configured `R.string.default_web_client_id` for Google Sign-In. |
| **PII in Logging** | Exception stack traces or auth responses logging usernames, phone numbers, or tokens to Logcat. | **Secured** | Handled `CustomCredential` and `GoogleIdTokenCredential` cleanly without leaking exception stack traces or user details. |
| **Firestore Rules** | Unauthorized data tampering, price escalation, cross-tenant order/product access, business self-approval, forged analytics. | **Secured** | Enforced least-privilege `firestore.rules`: business creation forced to `pending`, business ownership immutable, user role immutable, product cost subcollection isolated, line item price validation against product catalog, event author verification. Verified by **32 automated emulator tests**. |
| **Architecture / DI** | Direct `FirebaseFirestore.getInstance()` invocations in Activity/UI composables. | **Secured** | Injected `FirebaseFirestore` via Hilt `@Singleton` into `MainActivity` rather than calling `getInstance()` in `onCreate()`. |

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
- Sanitized exception handling across Credential Manager and Firebase Auth.
- Sensitive customer/owner fields (email, phone, fullName, tokens) are never formatted into `Log.*` statements or standard output streams.

---

## 4. Verification & Automated Testing
The security controls and architectural invariants were verified using automated tools:

1. **Firestore Rules Emulator Testing**:
   - `npm run test:rules` (**32 tests total - ALL PASSING**):
     - Role escalation prevention on create and update.
     - Writing to another user's document prevention.
     - Reading other customers' orders prevention.
     - Cross-owner product modification prevention.
     - Private cost subcollection isolation (`products/{id}/private/cost`).
     - Public `costPrice` prohibition.
     - Business creation required `status == 'pending'`.
     - Business ownership immutability.
     - Customer order creation blocked for unapproved businesses.
     - Order line item `unitPrice` validation against product catalog.
     - Forged analytics event prevention (`userId == auth.uid`).
     - Real-time snapshot listener integrity tests.
2. **JVM Unit Tests**:
   - `./gradlew testDebugUnitTest` (**PASSING**):
     - Auth error mapping, Anti-enumeration on password reset, ViewModel validation, Customer orders real-time flow and state handling.
3. **Android Lint**:
   - `./gradlew lintDebug` (**PASSING**):
     - Clean, zero fatal warnings or security-related lint errors.
4. **Assembly**:
   - `./gradlew assembleDebug` (**PASSING**):
     - Debug APK built successfully without errors or broken dependencies.

---

## 5. Known Limitations & Technical Debt
1. **Firebase Spark Tier Limits**: Because Cloud Functions are unavailable on the Spark plan, product inventory decrement and order creation rely on client-side Firestore multi-document transactions. While rules enforce business approval and order integrity, high-concurrency race conditions require server-side triggers for enterprise scale.
2. **Client-Side Search**: Feed filtering is evaluated locally over active product snapshot streams.
