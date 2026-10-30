# BlueSense

BlueSense es un sistema IoT para monitorear el nivel de agua de un depósito doméstico. Este repositorio reúne la aplicación móvil, la base ejecutable de la API y la documentación compartida del producto.

## Estructura

```text
apps/
├── mobile/     # aplicación React Native + Expo
└── api/        # backend Node.js + Express + TypeScript
firmware/       # futuro firmware del dispositivo (pendiente)
docs/           # documentación compartida
```

La aplicación móvil se comunica con el **backend API** para las operaciones de negocio; no debe acceder directamente a Firestore.

## Aplicación móvil

- Expo SDK 58
- React Native 0.88.1
- React 19.3.0
- TypeScript estricto
- Expo Router

### Entorno

Expo SDK 58 requiere Node.js 22.13.x como mínimo según la tabla oficial de compatibilidad. La migración y las verificaciones locales se realizaron con:

- Node.js `22.22.0`
- npm `10.9.4`

Estas son las versiones verificadas localmente; el requisito de Node procede de Expo y no implica que todas las versiones futuras de npm hayan sido comprobadas.

### Instalación

Desde la raíz del repositorio:

```bash
npm ci
```

### Comandos desde la raíz

```bash
npm start             # inicia Expo para apps/mobile
npm run android       # solicita abrir la app en Android
npm run ios           # solicita abrir la app en iOS
npm run web           # inicia la versión web
npm run typecheck     # comprueba tipos de la app móvil
npm test              # ejecuta las pruebas de todos los workspaces
npm run lint          # ejecuta ESLint sobre la app móvil
npm run format:check  # verifica formato de la app móvil
npm run doctor        # ejecuta Expo Doctor sobre apps/mobile
```

Estos comandos se limitan al workspace móvil y no analizan el backend o firmware como código React Native.

### Autenticación

La app usa Firebase Authentication con correo y contraseña. La configuración pública se carga desde `apps/mobile/.env`; usa [`apps/mobile/.env.example`](apps/mobile/.env.example) como plantilla. El archivo `.env` está ignorado por Git.

`EXPO_PUBLIC_API_URL` debe apuntar a la API. En un iPhone físico, `localhost` es el propio teléfono: usa la IP LAN del PC, por ejemplo `http://<PC_LAN_IP>:3000`, y asegúrate de que ambos estén en la misma red. HTTP local es sólo para desarrollo; producción requiere HTTPS.

El flujo completo, el contrato de `GET /me`, la persistencia de sesión, las limitaciones y los pasos manuales están en [`docs/auth.md`](docs/auth.md).

## Backend API

La base de `apps/api/` incluye un servidor Express ejecutable, TypeScript estricto, configuración validada de puerto, `GET /health`, verificación de ID tokens de Firebase Authentication y `GET /me`. No incluye todavía Firestore, perfiles ni funcionalidades de negocio.

Comandos desde la raíz:

```bash
npm run api:dev           # inicia la API en desarrollo
npm run api:build         # compila TypeScript
npm run api:start         # inicia la compilación existente
npm run api:test          # prueba configuración, salud y autenticación
npm run api:typecheck     # comprueba tipos de la API
npm run api:lint          # ejecuta ESLint sobre la API
npm run api:format:check  # verifica formato de la API
```

La configuración, los endpoints y las respuestas esperadas están documentados en [`apps/api/README.md`](apps/api/README.md).

## Estado del firmware

`firmware/` contiene únicamente documentación de alcance. No incluye implementaciones ficticias ni decisiones pendientes sobre modelos de hardware.
