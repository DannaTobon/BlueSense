# BlueSense API

Base ejecutable del backend de BlueSense con Node.js, Express y TypeScript. Expone salud del proceso, verificación de ID tokens de Firebase Authentication y `GET /me`. No contiene todavía lógica de negocio, Firestore ni perfiles de usuario.

## Requisitos

- Node.js `22.13.0` o posterior. El desarrollo se verificó con Node.js `22.22.0`.
- npm `10.9.4`, fijado en el `package.json` raíz.

## Instalación

Instala todos los workspaces desde la raíz del repositorio:

```bash
npm ci
```

El repositorio conserva un único `package-lock.json` en la raíz. No ejecutes instalaciones independientes dentro de `apps/api/`.

## Configuración

La API admite estas variables de entorno:

| Variable                         | Requerida | Valor predeterminado                          | Validación                                |
| -------------------------------- | --------- | --------------------------------------------- | ----------------------------------------- |
| `PORT`                           | No        | `3000`                                        | Entero entre `1` y `65535`                |
| `CORS_ALLOWED_ORIGINS`           | No        | `http://localhost:8081,http://127.0.0.1:8081` | Lista de orígenes HTTP(S), sin comodín    |
| `GOOGLE_APPLICATION_CREDENTIALS` | No        | —                                             | Ruta a credenciales ADC, sólo en servidor |

Para usar un archivo local, copia `apps/api/.env.example` como `apps/api/.env` y cambia únicamente valores de desarrollo:

```dotenv
PORT=3000
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
```

`GOOGLE_APPLICATION_CREDENTIALS` no es necesaria para `GET /me`: la verificación de ID tokens usa las claves públicas de Google. Se documenta como opción oficial para futuras operaciones administrativas que sí necesiten credenciales. Nunca copies una clave privada al repositorio, a la app móvil ni a la documentación.

Los comandos `api:dev` y `api:start` cargan explícitamente `apps/api/.env` mediante la opción nativa de Node.js `--env-file-if-exists`. Si el archivo no existe, se utilizan las variables del proceso y el puerto predeterminado. No se usa carga automática implícita ni una dependencia adicional para `.env`.

Un valor inválido detiene el arranque con código distinto de cero y el mensaje:

```text
Invalid PORT: expected an integer from 1 to 65535.
```

Los archivos `.env` locales están ignorados por Git; `.env.example` sólo contiene valores públicos de ejemplo.

Los orígenes predeterminados corresponden a `npm run web` en el puerto estándar de Expo. Si Expo selecciona otro puerto o se despliega una aplicación web, configura su origen exacto. La API no acepta `*`, no refleja orígenes desconocidos y no habilita credenciales de cookies; la autenticación sigue dependiendo del Bearer token verificado.

Cuando `NODE_ENV=production`, el arranque falla si existe `FIREBASE_AUTH_EMULATOR_HOST`. No configures esa variable para la prueba contra el proyecto real `bluesense-347f0`.

## Comandos

Ejecuta estos comandos desde la raíz:

```bash
npm run api:dev           # inicia TypeScript en modo observación
npm run api:build         # compila a apps/api/dist/
npm run api:start         # inicia la compilación existente
npm run api:test          # ejecuta las pruebas focalizadas
npm run api:typecheck     # comprueba tipos estrictos
npm run api:lint          # ejecuta ESLint sólo sobre la API
npm run api:format:check  # verifica el formato sólo de la API
npm run api:format        # aplica formato sólo en la API
```

`api:start` requiere haber ejecutado antes `api:build`.

## Endpoint de salud

`GET /health` comprueba únicamente que el proceso HTTP de la API responde.

Respuesta HTTP `200`:

```json
{
  "status": "ok"
}
```

Esta respuesta no afirma conectividad con Firebase, Firestore, dispositivos ni otros servicios.

## Autenticación e identidad

La API usa `firebase-admin` con el proyecto `bluesense-347f0` configurado explícitamente. El middleware de autenticación exige:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

El token se verifica con `verifyIdToken` del SDK oficial. No se acepta un token sólo por decodificarlo y no se confía en un UID enviado por el cliente.

### `GET /me`

Devuelve únicamente la identidad mínima del token verificado. No lee ni escribe Firestore, no crea perfiles y no incluye el nombre porque no está garantizado en el ID token.

Respuesta HTTP `200`:

```json
{
  "uid": "firebase-user-uid",
  "email": "person@example.com"
}
```

`email` es `null` si el token verificado no incluye ese claim.

Credenciales ausentes o con formato incorrecto responden HTTP `401`:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

Tokens inválidos o vencidos responden HTTP `401`:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token."
  }
}
```

Los errores conocidos de validación de token se traducen a `401`. Cualquier otro fallo del verificador o de infraestructura sigue el manejador genérico y responde HTTP `500` sin detalles internos.

### Credenciales administrativas

`GET /me` no necesita una clave privada de cuenta de servicio: `verifyIdToken` comprueba firma, emisor, audiencia y vencimiento con claves públicas de Google. La inicialización usa Application Default Credentials para dejar preparadas futuras operaciones administrativas.

No se solicitó, generó ni versionó ninguna clave. Si una operación futura necesita credenciales administrativas, usa las opciones oficiales (ADC en entornos Google, cuenta de servicio o identidad de carga de trabajo fuera de Google), mantén el secreto sólo en el servidor y fuera de Git.

Los tokens, contraseñas y credenciales nunca se registran en logs.

## Manejo básico de errores

Una ruta inexistente responde HTTP `404`:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route not found."
  }
}
```

Un error inesperado responde HTTP `500` sin traza ni detalles internos:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error."
  }
}
```

No existe un endpoint público para provocar errores. El comportamiento 500 se verifica con una aplicación local creada sólo dentro de las pruebas.

## Pendiente

Esta base todavía no implementa autorización por recurso, usuarios o perfiles, depósitos, dispositivos, telemetría, historial, alertas, cálculos de negocio ni Firestore. Esas capacidades requieren bloques de implementación posteriores.

## Pruebas

`npm run api:test` cubre configuración, salud, 404, 500 genérico y el contrato de `GET /me`: credenciales ausentes o malformadas, tokens inválidos o vencidos, identidad verificada, email ausente y fallos internos sin filtración de detalles. Los verificadores de prueba se inyectan desde `test/` y no existen ramas de prueba en el código de producción.

## Fuentes oficiales consultadas

- [Instalación de Express 5](https://expressjs.com/en/starter/installing.html): compatibilidad con Node.js 18 o posterior.
- [Manejo de errores de Express 5](https://expressjs.com/en/guide/error-handling.html): orden y firma del middleware de errores.
- [Variables de entorno en Node.js](https://nodejs.org/api/environment_variables.html) y [`--env-file-if-exists`](https://nodejs.org/api/cli.html#--env-file-if-existsfile): formato y carga explícita de `.env`.
- [Verificación de ID tokens con Firebase Admin](https://firebase.google.com/docs/auth/admin/verify-id-tokens): uso de `verifyIdToken` y validación de tokens.
- [Configuración del SDK Firebase Admin](https://firebase.google.com/docs/admin/setup): credenciales, ADC y cuentas de servicio.
- [`firebase-admin` en npm](https://www.npmjs.com/package/firebase-admin): versión publicada y requisito de Node.js, consultados con `npm view`.
- [`strict` de TypeScript](https://www.typescriptlang.org/tsconfig/strict.html): comprobación estricta de tipos.
- [Inicio de typescript-eslint](https://typescript-eslint.io/getting-started/): configuración plana y reglas TypeScript para ESLint.
- [Registro oficial de Express](https://www.npmjs.com/package/express): versión publicada y requisito de Node.js, consultados con `npm view`.

Las herramientas del backend permanecen declaradas en `apps/api/package.json` y sus configuraciones sólo analizan la API. Sus versiones se eligieron por compatibilidad con Node.js 22.13 o posterior sin actualizar las dependencias móviles.
