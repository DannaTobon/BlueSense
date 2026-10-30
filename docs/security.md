# BlueSense — Security

## User authentication

Firebase Authentication manages user identity and passwords. The MVP supports email/password registration and sign-in.

The mobile app obtains a current Firebase ID token and sends:

```http
Authorization: Bearer <ID_TOKEN>
```

The backend verifies the token with the official Firebase Admin SDK before protected operations. It does not accept a token merely because it can be decoded, and it does not trust a client-supplied UID.

## Token verification

`GET /me` requires a valid ID token. The backend checks the token signature, issuer, audience, and expiry. Missing, malformed, invalid, or expired credentials return HTTP `401`.

Known token-validation failures are distinguished from internal or infrastructure failures. Internal failures return a generic HTTP `500` without details.

Browser access uses an explicit CORS origin allowlist. CORS does not authorize a request: `GET /me` still requires a verified Bearer token. Production startup rejects `FIREBASE_AUTH_EMULATOR_HOST` so the Admin SDK cannot accidentally switch to unsigned emulator-token verification.

Tokens, passwords, and credentials are never logged.

Authentication errors do not confirm whether another account exists. Invalid credentials, disabled accounts, and registration conflicts use non-enumerating messages.

## Session handling

The mobile app persists the Firebase session with the official mechanisms:

- Native: Firebase `initializeAuth` with AsyncStorage persistence.
- Web: Firebase `browserLocalPersistence`.

Application code does not store tokens manually. Sign-out calls Firebase Authentication and clears app-held private state. Sign-out does not claim to revoke every token already issued; ID tokens remain valid until expiry unless server-side revocation is implemented.

## Authorization

Authentication identifies the user. The backend must still verify that the authenticated user is authorized to access the requested BlueSense device.

## Device authentication

Each ESP32 has its own device credential. The device ID is an identifier, not a secret.

Never display, commit, or log device credentials in plaintext.

## Transport

Normal device telemetry uses HTTPS/TLS. BLE is limited to provisioning.

Local HTTP is acceptable only for development. Production API traffic must use HTTPS.

## QR

The physical QR helps identify the device and start pairing. It is not the sole security mechanism.

## Secrets

Use environment variables or platform secret management. Never commit private keys, device credentials, production tokens, passwords, or API secrets.

Firebase web-app identifiers in `EXPO_PUBLIC_*` variables are public client configuration, not private keys. They still belong to the Firebase project and should be restricted according to the project's Firebase console settings.

The backend uses Application Default Credentials for Firebase Admin initialization. No service-account private key is required for `GET /me`, because ID token verification uses Google's public keys. If a future operation needs administrative credentials, keep them server-side and outside Git, and prefer ADC or workload identity where available.

## Future

Possible improvements include App Check, email verification, password recovery, token revocation, secure boot, firmware encryption, secure OTA, and stronger device attestation.
