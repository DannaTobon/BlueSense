# BlueSense API

Base ejecutable del backend de BlueSense con Node.js, Express y TypeScript. En esta etapa sólo expone salud del proceso, configuración del puerto y manejo JSON básico de errores. No contiene lógica de negocio ni integra servicios externos.

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

La API admite esta variable de entorno:

| Variable | Requerida | Valor predeterminado | Validación                 |
| -------- | --------- | -------------------- | -------------------------- |
| `PORT`   | No        | `3000`               | Entero entre `1` y `65535` |

Para usar un archivo local, copia `apps/api/.env.example` como `apps/api/.env` y cambia únicamente valores de desarrollo:

```dotenv
PORT=3000
```

Los comandos `api:dev` y `api:start` cargan explícitamente `apps/api/.env` mediante la opción nativa de Node.js `--env-file-if-exists`. Si el archivo no existe, se utilizan las variables del proceso y el puerto predeterminado. No se usa carga automática implícita ni una dependencia adicional para `.env`.

Un valor inválido detiene el arranque con código distinto de cero y el mensaje:

```text
Invalid PORT: expected an integer from 1 to 65535.
```

Los archivos `.env` locales están ignorados por Git; `.env.example` sólo contiene valores públicos de ejemplo.

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

Esta base todavía no implementa autenticación, autorización, usuarios, depósitos, telemetría, historial, alertas, cálculos de negocio, Firebase ni Firestore. Esas capacidades requieren bloques de implementación posteriores.

## Fuentes oficiales consultadas

- [Instalación de Express 5](https://expressjs.com/en/starter/installing.html): compatibilidad con Node.js 18 o posterior.
- [Manejo de errores de Express 5](https://expressjs.com/en/guide/error-handling.html): orden y firma del middleware de errores.
- [Variables de entorno en Node.js](https://nodejs.org/api/environment_variables.html) y [`--env-file-if-exists`](https://nodejs.org/api/cli.html#--env-file-if-existsfile): formato y carga explícita de `.env`.
- [`strict` de TypeScript](https://www.typescriptlang.org/tsconfig/strict.html): comprobación estricta de tipos.
- [Inicio de typescript-eslint](https://typescript-eslint.io/getting-started/): configuración plana y reglas TypeScript para ESLint.
- [Registro oficial de Express](https://www.npmjs.com/package/express): versión publicada y requisito de Node.js, consultados con `npm view`.

Las versiones de TypeScript, ESLint y Prettier se alinean con el workspace móvil existente para evitar actualizar sus dependencias. Las herramientas del backend permanecen declaradas en `apps/api/package.json` y sus configuraciones sólo analizan la API.
