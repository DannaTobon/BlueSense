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
- User enters capacity.
- User enters physical height; system initially subtracts 10 cm safety distance.
- Level/volume calculations account for calibration and geometry.
- ESP32 primarily sends physical measurements; backend owns business calculations.
- ONLINE/OFFLINE is derived from `lastSeenAt`.
- The project uses a single repository: `apps/mobile/` for the Expo app, `apps/api/` for the future backend, `firmware/` for future device code, and `docs/` for shared documentation.
- The mobile application targets Expo SDK 58. The migration from SDK 57 was made to match the currently distributed Expo Go client.

## Changing a decision
If implementation requires a change:
1. Explain why.
2. Identify affected modules.
3. Update this document.
4. Update related architecture documentation.
5. Then implement the change.
