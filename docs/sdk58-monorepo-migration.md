# Expo SDK 58 and monorepo migration

Date: 2026-10-30

## Scope

- Upgraded the existing mobile application from Expo SDK 57 to SDK 58.
- Moved the mobile application to `apps/mobile/`.
- Added the future `apps/api/` and `firmware/` locations as documentation only.
- Configured npm workspaces with a single root `package-lock.json`.
- No MVP functionality, backend implementation, or firmware implementation was added.

## Verified environment

- Node.js `22.22.0` (Expo SDK 58 requires Node.js 22.13.x or newer).
- npm `10.9.4`.
- Expo `58.0.21`.
- React Native `0.88.1`.
- React `19.3.0`.

## Automated verification

- Reproducible root installation with `npm ci`.
- Expo Doctor: 20/20 checks passed.
- TypeScript, ESLint, and Prettier checks passed.
- Metro started successfully from the repository root.
- Android, iOS, and web export bundles were generated outside the repository.

An export verifies bundling only; it does not replace execution on a physical device.

## Physical device validation

### iPhone — validated

The application was opened with the SDK 58-compatible Expo Go client and passed the following checks:

- Opened without an SDK incompatibility message or red error screen.
- The **Inicio** and **Estado** tabs worked.
- The **Estado** screen displayed Expo SDK 58.

### Android — pending

No Android device was available for this migration review. Android remains pending physical validation even though the Android export completed successfully.
