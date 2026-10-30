# BlueSense — Agent Instructions

## Project purpose
BlueSense is an IoT system for monitoring the water level of a household water deposit. The MVP measures water level, estimates available water, stores readings, shows history, and generates alerts/recommendations.

The product must not assume that every household uses a pump. The current MVP monitors water availability and recommends filling the deposit when appropriate. Physical pump control is future scope.

## Technology
- Mobile: React Native, Expo SDK 58, TypeScript, Expo Router
- Backend: Node.js, Express, TypeScript
- Authentication: Firebase Authentication
- Persistence: Cloud Firestore
- Device: ESP32 + ultrasonic sensor
- Provisioning: BLE
- Normal telemetry: Wi-Fi + HTTPS/TLS

## Mandatory architecture
```text
Mobile App ───────► Backend API ───────► Firestore
                         ▲
                         │
ESP32 ── Wi-Fi/HTTPS ────┘
```

The backend is the business and security boundary. Do not introduce direct Mobile → Firestore business flows.

## Repository structure
BlueSense uses a single repository with npm workspaces:
```text
apps/mobile/  # Expo mobile application
apps/api/     # Future Node.js/Express API (documentation only for now)
firmware/     # Future ESP32 firmware (documentation only for now)
docs/         # Shared project documentation
```

Only `apps/mobile` is currently an executable workspace. Do not create placeholder backend or firmware implementations before their requirements and hardware details are available.

## MVP rules
- 1 account → 1 BlueSense → 1 water deposit.
- Multiple devices and device transfer are future scope.
- Device ID identifies a device; it is not a secret.
- Each device has its own credential.
- QR identifies the device/starts pairing; it is not the only security mechanism.
- BLE is for provisioning, not normal telemetry.
- ESP32 primarily sends physical measurements such as `distanceCm`.
- Business calculations belong in the backend.
- Do not assume a pump exists.
- Pump control is not MVP.
- MVP supports vertical cylindrical and rectangular/square deposits.
- Irregular and horizontal cylindrical geometries are future scope.
- User enters capacity and height.
- System initially applies a 10 cm safety distance automatically; this is an MVP parameter to validate.
- Volume calculation must account for geometry.
- Sensor readings require validation/filtering/stabilization.
- Online/offline is derived from `lastSeenAt`; no separate online message is required.

## Data flow
```text
Ultrasonic sensor
  ↓
distanceCm
  ↓
validation/filtering
  ↓
calibration/configuration
  ↓
level %
  ↓
estimated volume/liters
  ↓
history
  ├── trend
  ├── alerts
  └── recommendations
```

## Mobile architecture
Preferred conceptual structure:
```text
apps/mobile/src/
├── app/
├── components/
├── features/
├── services/
├── repositories/
├── types/
├── constants/
├── hooks/
└── utils/
```
UI must not depend directly on Firestore or persistence details.

## Backend architecture
```text
Routes
↓
Middleware
  ├─ Authentication
  ├─ Authorization
  └─ Validation
↓
Controller
↓
Service
↓
Domain / Business Logic
↓
Repository
↓
Firestore
```

## Security
- Never commit secrets.
- Firebase Authentication handles user passwords.
- Backend verifies Firebase ID tokens.
- Backend authorizes access to the requested device.
- Device credentials are secrets and must not appear in UI, logs, docs, or source control.
- HTTPS/TLS is required for normal ESP32 telemetry.
- QR is not the sole authentication factor.

## Agent workflow
Before changing code:
1. Read this file.
2. Read relevant `docs/` files.
3. Inspect existing implementation.
4. Keep scope narrow.
5. Do not silently change frozen decisions.
6. If an architectural change is necessary, explain its impact before implementing.
7. Prefer small, reviewable changes.
8. Run relevant lint/type/test checks.
9. Report modified files, checks, and remaining issues.

Do not implement future-scope functionality merely because it is documented.

## Future scope
- Pump/relay control
- Automatic filling
- Multiple devices
- Device transfer
- OTA user-facing functionality
- Advanced leak detection
- Additional geometries
- Automatic capacity calculation
- Specialized telemetry database
