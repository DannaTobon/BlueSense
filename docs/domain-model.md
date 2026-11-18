# BlueSense — Domain Model

## Relationships
```text
User
 │ 1
 │ 1
 ▼
Device
 │ 1
 ▼
WaterContainer
 ├── 0..* Reading
 ├── 0..* Alert
 ├── 0..* Recommendation
 └── 0..* DeviceEvent
```

## User
- uid
- name
- email
- createdAt
- deviceId/reference

Firebase Authentication owns password handling.

## Device
- deviceId
- userId
- deviceCredential
- firmwareVersion
- lastSeenAt
- connectionStatus
- operationalStatus
- createdAt

Operational states can include:
UNPROVISIONED, PROVISIONING, CONNECTING, MONITORING, SENSOR_ERROR.

Connectivity:
ONLINE / OFFLINE.

## WaterContainer
- id
- type
- capacityLiters (optional nominal value)
- heightCm
- emptyDistanceCm (installed sensor reference at 0%)
- fullDistanceCm (installed sensor reference at safe 100%)
- geometry-specific dimensions
- calibration configuration
- thresholds

MVP types:
VERTICAL_CYLINDER, RECTANGULAR.

## Reading
- id
- deviceId
- timestamp
- distanceCm
- levelPercentage
- estimatedLiters
- quality/status when needed

Preliminary processing statuses are `VALID`, `INSUFFICIENT_DATA`, `INVALID_READING`, and `OUT_OF_RANGE`. A valid short window uses its median before level and volume calculation. Liters identify whether their source is nominal capacity or measured geometry.

## Alert
- id
- deviceId
- type
- title
- message
- createdAt
- read

## Recommendation
- id
- deviceId
- type
- message
- generatedAt
- context when needed

Types may include:
LOW_LEVEL, TARGET_REACHED, FILLING, SLOW_FILLING, INSUFFICIENT_DATA.

## DeviceEvent
Relevant events such as:
PROVISIONED, CONNECTED, DISCONNECTED, SENSOR_ERROR.
