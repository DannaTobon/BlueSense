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

| Variable                                   | Required | Purpose                              |
| ------------------------------------------ | -------- | ------------------------------------ |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | Yes      | Firebase web app API key             |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Yes      | Firebase Auth domain                 |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | Yes      | Firebase project ID                  |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Yes      | Firebase storage bucket              |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes      | Firebase messaging sender ID         |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | Yes      | Firebase web app ID                  |
| `EXPO_PUBLIC_API_URL`                      | Yes      | Base URL of the BlueSense backend    |

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

The web build keeps working for authentication. Cross-origin browser calls to `GET /me` would require an explicit CORS allowlist, which is intentionally not added here.

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

Known token-validation errors are mapped to `401`. Other verifier or infrastructure failures go through the existing generic handler and return HTTP `500` without internal details.

`GET /health` remains public and unchanged.

Tokens, passwords, and credentials are never logged.

## Tests

Backend tests cover:

- Missing and malformed authorization headers.
- Invalid and expired tokens.
- A valid token producing only the verified identity.
- A missing email claim.
- Internal verifier failures without detail leakage.
- The public `/health` endpoint.

Mobile unit tests cover:

- Auth error mapping.
- Registration and sign-in validation.
- Password-policy requirement descriptions.
- Session state mapping.
- API client success, `401`, network, server, invalid-response, and abort behavior.

Test doubles are defined only in `test/` files and injected into `createApp`; production code has no test-only branches.

## Manual verification still required

The following require a person and a real Firebase project; they were not performed by this implementation:

1. Create local `apps/mobile/.env` values.
2. Start the API with `npm run api:dev` and check `GET /health`.
3. Start Expo and open the app on a physical device.
4. Register a test account and confirm the name is stored in Firebase Auth.
5. Reload the app and confirm the session persists.
6. Tap the `GET /me` check and confirm the verified UID and email.
7. Sign out and confirm private routes are no longer reachable.
8. Repeat on Android.

The SDK 58 baseline was previously checked on a physical iPhone. This authentication flow has not been physically validated on iPhone or Android.

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
