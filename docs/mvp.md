# BlueSense — MVP Rules

## Included
### Account
- Registration with name, email, password.
- Login/logout through Firebase Authentication.

### Device
- One BlueSense device per account.
- Device identification and pairing.
- Device connection status.

### Deposit
- Vertical cylindrical deposit.
- Rectangular/square deposit.
- Capacity entered by user.
- Height entered by user.
- Initial automatic 10 cm safety distance.
- Calibration/configuration.

### Monitoring
- Ultrasonic distance measurement.
- Reading validation/filtering.
- Level percentage.
- Estimated liters when applicable.
- History.

### Recommendations
- Low level: `Se recomienda llenar el depósito.`
- Target reached: `El depósito alcanzó el nivel recomendado.`
- Filling progress: approximate filling rate and time to target when enough data exists.
- Slow filling: say filling is slower than usual; do not claim a pump failure.

## Excluded
- Pump control
- Automatic filling
- Multiple devices
- Device transfer
- Irregular/horizontal geometries
- Automatic capacity calculation
- Advanced leak diagnosis

## Calculation rule
Volume depends on geometry. For a vertical cylinder:
`V = π × r² × h`
Do not universally use `capacity × percentage` without considering geometry.
