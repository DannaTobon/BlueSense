# BlueSense

BlueSense es un sistema IoT para monitorear el nivel de agua de un depósito doméstico. Este repositorio reúne los componentes del producto, aunque actualmente sólo la aplicación móvil tiene implementación ejecutable.

## Estructura

```text
apps/
├── mobile/     # aplicación React Native + Expo
└── api/        # futuro backend Node.js/Express (pendiente)
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
npm run lint          # ejecuta ESLint sobre la app móvil
npm run format:check  # verifica formato de la app móvil
npm run doctor        # ejecuta Expo Doctor sobre apps/mobile
```

Los comandos de calidad se limitan al workspace móvil y no tratan el futuro backend o firmware como código React Native.

## Estado del resto de componentes

`apps/api/` y `firmware/` contienen únicamente documentación de alcance. No incluyen implementaciones ficticias ni decisiones pendientes sobre modelos de hardware.
