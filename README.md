# BlueSense — Aplicación móvil

BlueSense es un sistema IoT para monitorear el nivel de agua de un depósito doméstico.

Este repositorio contiene la **aplicación móvil** (React Native + Expo). Las decisiones arquitectónicas del proyecto se documentan en [`docs/`](docs/).

## Stack

- Expo SDK 57
- React Native
- TypeScript (strict)
- Expo Router (file-based routing)

## Scripts

```bash
npm start             # inicia el servidor de desarrollo de Expo
npm run android       # abre en Android
npm run ios           # abre en iOS
npm run web           # abre en web
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # formatea el código con Prettier
npm run format:check  # verifica el formato
```

## Estructura

```text
src/
├── app/          # rutas de Expo Router
├── components/   # componentes de UI
├── constants/    # tema y valores compartidos
└── hooks/        # hooks compartidos
```

La aplicación móvil se comunica con el **backend API**; no accede directamente a Firestore para operaciones de negocio.
