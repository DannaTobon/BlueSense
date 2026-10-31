# BlueSense — Architecture

## High level
```text
                         BLUE SENSE
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  Mobile App            Backend API              ESP32
  React Native          Node.js/Express          + Sensor
  Expo + TS
        │                    │                    │
        │                    ▼                    │
        │                Firestore                │
        │                                         │
        └──────────── Firebase Auth ──────────────┘
```

The backend is the business and security boundary.

## Authentication
```text
Mobile App
   ↓
Firebase Authentication (email/password)
   ↓
Firebase ID Token
   ↓
Backend API
   ↓
verifyIdToken()
   ↓
GET /me → verified uid + email
   ↓
Authorize resource access
```

The backend verifies the token with the official Firebase Admin SDK. It never trusts a client-supplied UID. The mobile app does not access Firestore directly for business operations.

The detailed authentication contract, persistence strategy, local-development URL guidance, and limitations are in [`auth.md`](auth.md).

## Provisioning
```text
Add BlueSense
→ Scan QR
→ Identify device
→ Discover ESP32 via BLE
→ Configure Wi-Fi
→ Configure device credential
→ Link device to account
→ Configure deposit
→ Start monitoring
```

## Telemetry
Example:
```json
{
  "deviceId": "BS-8F3A29",
  "timestamp": "...",
  "distanceCm": 8.4
}
```
The backend validates the measurement, applies calibration/configuration, calculates level and volume, analyzes it, and persists the result.

## Online/offline
The backend updates `lastSeenAt` on valid communication and derives ONLINE/OFFLINE from the expected telemetry interval.

## Backend layers
```text
Routes
↓
Middleware
↓
Controllers
↓
Services
↓
Domain logic
↓
Repositories
↓
Firestore
```

## Future
The architecture can later support:
```text
App → Backend → ESP32 → Relay → Pump
```
without making a pump mandatory for the MVP.
