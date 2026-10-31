# BlueSense — Authentication (email/password block)

This document describes the authentication slice implemented in `apps/mobile` and `apps/api`. It does not describe Firestore, user profiles, deposits, devices, provisioning, telemetry, history, alerts, or business calculations.

## Architecture

```text
Mobile app
  ↓ Firebase Authentication (email/password)
  ↓ current Firebase ID token
Backend API
  ↓ firebase-admin verifyIdToken()
  ↓ verified uid + email
GET /me
```

The mobile app never accesses Firestore directly. The backend remains the business and security boundary.

## Mobile app

### Configuration

The mobile app reads public Firebase web-app identifiers and the API base URL from `EXPO_PUBLIC_*` variables:

| Variable                                   | Required | Purpose                           |
| ------------------------------------------ | -------- | --------------------------------- |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | Yes      | Firebase web app API key          |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Yes      | Firebase Auth domain              |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | Yes      | Firebase project ID               |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Yes      | Firebase storage bucket           |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes      | Firebase messaging sender ID      |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | Yes      | Firebase web app ID               |
| `EXPO_PUBLIC_API_URL`                      | Yes      | Base URL of the BlueSense backend |

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in local values. `apps/mobile/.env` is ignored by Git. These Firebase values identify the public web app; they are not user credentials or private keys.

### Session lifecycle

- `onAuthStateChanged` is the source of truth for the session.
- The app starts in a loading state while Firebase restores a persisted session.
- The splash screen remains visible until the first auth state is known.
- The listener is released when the provider unmounts.
- No tokens are stored manually by application code.

Persistence uses the official Firebase mechanisms:

- Native: `initializeAuth` with `getReactNativePersistence(AsyncStorage)`.
- Web: `initializeAuth` with `browserLocalPersistence`.

### Registration and sign-in

Registration collects name, email, and password:

1. The app validates the form.
2. `validatePassword` checks the password against the effective Firebase password policy.
3. `createUserWithEmailAndPassword` creates the account.
4. `updateProfile` stores the name in the Firebase Auth profile.

If account creation succeeds but `updateProfile` fails, the app keeps the authenticated session and shows an explicit partial-registration notice. The account is not presented as fully complete.

The password is never trimmed or silently transformed. Email is trimmed before use. Sign-in and registration errors avoid confirming whether another account exists; invalid credentials and disabled accounts use generic messages.

### Navigation and sign-out

- Public routes: `sign-in`, `register`.
- Private routes: the authenticated tab area.
- Expo Router `Stack.Protected` guards prevent direct navigation to the private area while unauthenticated and redirect authenticated users away from public screens.
- Sign-out calls Firebase Authentication, clears app-held private state, and invalidates in-flight API checks so late responses cannot repopulate a closed session.
- Sign-out is local to the app session. It does not claim to revoke every token already issued; ID tokens remain valid until they expire unless server-side revocation is implemented.

### API client

For each authenticated API request, the app obtains a current ID token and sends:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

The authenticated area includes a visible `GET /me` check. The Firebase session state and the API result are displayed separately. A network error, a `401`, or a `5xx` response never hides or invalidates the local Firebase session.

There are no automatic retry loops. The check is triggered by the user.

### Local development URL

A phone's `localhost` is the phone itself, not the development PC. For a physical iPhone on the same Wi-Fi network, use the PC's LAN address in `apps/mobile/.env`, for example:

```dotenv
EXPO_PUBLIC_API_URL=http://<PC_LAN_IP>:3000
```

Replace `<PC_LAN_IP>` with the address of the development machine. The API listens on the port configured by `PORT` (default `3000`). The operating-system firewall must allow the connection.

Local HTTP is only for development. Production traffic must use HTTPS. No deployment, tunnel, or LAN address is configured by this block.

The API has an explicit CORS allowlist for browser requests. By default it permits the origins used by Expo web on its standard local port:

```text
http://localhost:8081
http://127.0.0.1:8081
```

Set `CORS_ALLOWED_ORIGINS` in `apps/api/.env` to a comma-separated list when Expo uses another port or a deployed web origin. Wildcards, paths, and arbitrary reflected origins are rejected. CORS permits `GET` and the `Authorization` header, does not enable cookie credentials, and never replaces Firebase token verification. Native requests do not send `Origin` and continue through the same authentication middleware.

## Backend API

### Firebase Admin initialization

`apps/api` uses `firebase-admin` with the project ID explicitly set to `bluesense-347f0`.

The Admin SDK verifies ID tokens with `verifyIdToken`. Verification checks the token signature, issuer, audience, and expiry using Google's public keys. A service-account private key is not required for `GET /me`.

Initialization uses `applicationDefault()` so that future server-side Admin operations can use Application Default Credentials. No service-account key was requested, generated, or committed. If a later operation needs credentials:

- Prefer Application Default Credentials in Google environments.
- In non-Google environments, use the official service-account or workload-identity options and keep credentials server-side, outside Git.
- Never expose credentials to the mobile app, logs, documentation, or source control.

### `GET /me`

Requires a valid Firebase ID token:

```http
GET /me
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Successful response, HTTP `200`:

```json
{
  "uid": "firebase-user-uid",
  "email": "person@example.com"
}
```

`email` is `null` when the verified token has no email claim.

The response contains only the minimal identity derived from the verified token. It does not read or write Firestore, create profiles, or trust a client-supplied UID. The display name is not part of this contract because it is not reliably present in the ID token; the mobile app shows the Firebase profile name separately.

### Authentication failures

Missing, malformed, invalid, or expired credentials return HTTP `401`.

Missing or malformed header:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

Invalid or expired token:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token."
  }
}
```

Known token-validation errors are mapped to `401`. In `firebase-admin@14.5.0`, malformed tokens and failures while fetching Google's public certificates can both surface as `auth/argument-error`. The middleware therefore maps only the SDK's specific token-validation forms to `401`; certificate-fetch and unknown verifier failures go through the generic handler and return HTTP `500` without internal details.

Production startup rejects `FIREBASE_AUTH_EMULATOR_HOST`. This prevents an inherited environment variable from making Firebase Admin accept unsigned Auth Emulator tokens in production. This block does not add or configure a complete emulator workflow.

`GET /health` remains public and unchanged.

Tokens, passwords, and credentials are never logged.

## Tests

Backend tests cover:

- Missing and malformed authorization headers.
- Invalid and expired tokens.
- A valid token producing only the verified identity.
- A missing email claim.
- Internal verifier failures without detail leakage.
- The installed Firebase Admin error forms for malformed tokens and certificate-fetch failures.
- Allowed and denied CORS origins, preflight, native requests, and authentication after CORS.
- Rejection of the Auth Emulator environment variable in production.
- The public `/health` endpoint.

Mobile unit tests cover:

- Auth error mapping.
- Registration and sign-in validation.
- Password-policy requirement descriptions.
- Session state mapping.
- API client success, `401`, network, server, invalid-response, and abort behavior.
- Real Expo Router protected guards for signed-in, signed-out, and restoring states.
- Immediate complete and partial registration state, plus stale completion after logout or session replacement.

API test doubles are defined under `apps/api/test/` and injected into `createApp`. Mobile doubles live in `apps/mobile/__tests__/` and Jest setup, and are injected through `AuthSessionProvider`. Production code has no environment-controlled authentication bypass.

## Dependency and line-ending diagnostics

At the time of this correction, `npm audit` reports 20 findings: 13 low and 7 high. `origin/main` reported 5 low and 3 high before this authentication branch.

- Four additional high findings come through the mobile `firebase` package's bundled Firestore dependency and `@grpc/grpc-js`. BlueSense does not currently import Firestore or run a gRPC server in the mobile authentication flow, which limits known exposure but does not remove the vulnerable packages from the lockfile or make them safe for future use. Firebase 12.19.0 is the latest compatible major in the verified Node 22 environment; Firebase 13 modules require Node 24.12 or later. Audit's proposed downgrade to Firebase 9.14.0 is not a compatible correction for this implementation.
- Eight additional low findings come from the SDK 58-compatible Jest/Expo Router test toolchain. These packages are development-only, but they still remain reportable supply-chain findings. Audit's suggested major downgrades conflict with Expo SDK 58's Jest 30 and React Native Testing Library 14 requirements.

No forced audit fix or out-of-range override is applied. Reassess compatible upstream releases before deployment and before any future Firestore use.

On Windows, this checkout has `core.autocrlf=true`, no repository `.gitattributes`, and Prettier expects LF. Mobile lint therefore reports 371 CRLF warnings in pre-existing files while producing no lint errors; global format checks remain failing. This correction formats only touched files and does not perform a repository-wide line-ending rewrite or change global Git configuration.

## Manual verification

### iPhone — validated by the user

The user validated the following authentication behavior on a physical iPhone with the real Firebase project and Expo Go:

- Registration completed and the saved name was visible immediately.
- `GET /me` reported a verified identity whose UID and email matched Firebase Authentication.
- The Firebase session persisted after fully closing and reopening Expo Go.
- Sign-out redirected to sign-in, and reopening the app afterward kept it signed out.
- An incorrect password showed an error and did not grant access.
- Correct credentials granted access and displayed the saved name.
- Stopping the API showed a connection error without removing the Firebase session.
- Restarting the API allowed `GET /me` to verify the identity again.

No email address, UID, password, or token used during this validation is stored in the repository.

### Still pending

- Physical Android authentication validation.
- Real browser validation of the web flow and CORS behavior.
- Scenarios not listed in the confirmed iPhone evidence above.

## Official sources

- [Expo Router authentication](https://docs.expo.dev/router/advanced/authentication/)
- [Expo Router protected routes](https://docs.expo.dev/router/advanced/protected/)
- [Expo Firebase guide](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Auth state persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)
- [Firebase email/password authentication](https://firebase.google.com/docs/auth/web/password-auth)
- [Firebase user management](https://firebase.google.com/docs/auth/web/manage-users)
- [Firebase Admin: verify ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firebase Admin SDK setup](https://firebase.google.com/docs/admin/setup)
- [AsyncStorage for Expo](https://docs.expo.dev/versions/latest/sdk/async-storage/)
