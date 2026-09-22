# BlueSense — Security

## User authentication
Firebase Authentication manages user identity and passwords. The app obtains an ID token and sends:
`Authorization: Bearer <ID_TOKEN>`

The backend verifies the token before protected operations.

## Authorization
The backend must verify that the authenticated user is authorized to access the requested BlueSense device.

## Device authentication
Each ESP32 has its own device credential. The device ID is an identifier, not a secret.

Never display, commit, or log device credentials in plaintext.

## Transport
Normal device telemetry uses HTTPS/TLS. BLE is limited to provisioning.

## QR
The physical QR helps identify the device and start pairing. It is not the sole security mechanism.

## Secrets
Use environment variables or platform secret management. Never commit private keys, device credentials, production tokens, passwords, or API secrets.

## Future
Possible improvements include App Check, secure boot, firmware encryption, secure OTA, and stronger device attestation.
