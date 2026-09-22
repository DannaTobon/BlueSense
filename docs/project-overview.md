# BlueSense — Project Overview

BlueSense is an IoT system for monitoring the level of water in household deposits.

## MVP
- Water-level monitoring
- Percentage display
- Estimated liters when geometry supports it
- Device connection status
- Reading history
- Deposit configuration
- Basic alerts and recommendations

## Outside MVP
- Physical/automatic pump control
- Multiple devices per account
- Device transfer
- Arbitrary geometries
- Automatic capacity calculation
- Advanced leak detection
- User-facing OTA

## Product language
Do not assume a pump. Prefer:
> Se recomienda llenar el depósito.

## Main flow
```text
ESP32 + ultrasonic sensor
        ↓
physical measurement
        ↓
Backend
        ↓
level / volume calculation
        ↓
Firestore
        ↓
Mobile App
```
