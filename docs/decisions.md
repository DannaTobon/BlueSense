# BlueSense — Architecture Decisions

These decisions should not be changed casually during implementation.

- Firebase Authentication for user identity.
- Cloud Firestore as initial persistence.
- Backend is the business and authorization boundary.
- Mobile does not directly access Firestore for business operations.
- ESP32 + ultrasonic sensor.
- BLE for initial provisioning.
- Wi-Fi + HTTPS/TLS for normal telemetry.
- Unique Device ID plus separate device credential.
- Physical QR for identification/pairing UX, not as sole security mechanism.
- MVP: 1 account → 1 BlueSense → 1 water deposit.
- Use `WaterContainer` / deposit as the generic domain concept.
- Pump control is future scope.
- MVP supports vertical cylindrical and rectangular/square deposits.
- Nominal capacity is optional in the preliminary configuration. When it is unknown, liters are estimated from the supported measured geometry.
- User enters interior height and two installed-sensor references: distance at empty (0%) and distance at the safe full level (100%). This preliminary calibration replaces the unvalidated fixed 10 cm assumption.
- Level/volume calculations account for calibration and geometry.
- Short measurement windows are stabilized with a median. Sensor-specific noise thresholds remain pending real-hardware validation.
- ESP32 primarily sends physical measurements; backend owns business calculations.
- ONLINE/OFFLINE is derived from `lastSeenAt`.
- The project uses a single repository: `apps/mobile/` for the Expo app, `apps/api/` for the executable backend, `firmware/` for future device code, and `docs/` for shared documentation.
- The mobile application targets Expo SDK 58. The migration from SDK 57 was made to match the currently distributed Expo Go client.
- MVP authentication uses Firebase email/password. Other providers, password recovery, mandatory email verification, and account linking are future scope.
- The mobile app sends the current Firebase ID token to the backend. The backend verifies it with the official Firebase Admin SDK and does not trust client-supplied identity.
- `GET /me` returns only the verified `uid` and `email`. It does not read Firestore or create user profiles.
- Native session persistence uses Firebase `initializeAuth` with AsyncStorage; web uses `browserLocalPersistence`. Application code does not store tokens manually.

## Changing a decision
If implementation requires a change:
1. Explain why.
2. Identify affected modules.
3. Update this document.
4. Update related architecture documentation.
5. Then implement the change.
