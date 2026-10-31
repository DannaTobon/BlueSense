# Propuesta de vinculación de dispositivos

> **Estado: Propuesta pendiente de aprobación.** Este documento no registra como aprobados el mecanismo criptográfico, el formato del QR, el protocolo BLE ni el proceso de alta de fábrica. No implementa endpoints, firmware, colecciones ni credenciales.

## Alcance y decisiones ya confirmadas

Esta propuesta conserva las decisiones existentes:

- Flujo de producto: cuenta autenticada → vincular un BlueSense → configurar su depósito.
- MVP: una cuenta tiene como máximo un dispositivo y cada dispositivo tiene como máximo un propietario. Transferencia y múltiples dispositivos quedan fuera de alcance.
- `deviceId` identifica al dispositivo, pero no es secreto.
- Cada dispositivo tiene una credencial propia.
- El QR identifica el dispositivo e inicia el flujo; no constituye por sí solo la prueba de vinculación.
- BLE se limita al aprovisionamiento. La telemetría normal usa Wi-Fi y HTTPS/TLS.
- El backend verifica el Firebase ID token, autoriza el recurso y es el único componente de aplicación que accede a Firestore.
- Firestore es la base `(default)` de `bluesense-347f0`, en `northamerica-south1`, con reglas de cliente `allow read, write: if false`.
- Los modelos exactos del ESP32 y del sensor, el framework de firmware y sus capacidades criptográficas siguen sin registrarse. No hay firmware ni BLE implementados.

Fuentes internas: `AGENTS.md`, `docs/decisions.md`, `docs/architecture.md`, `docs/domain-model.md`, `docs/security.md` y `firmware/README.md`.

## Problema que debe resolver el mecanismo

Conocer o copiar un `deviceId` no debe permitir vincular un BlueSense. El backend necesita comprobar simultáneamente que:

1. la solicitud pertenece a una cuenta Firebase autenticada;
2. el dispositivo fue registrado previamente como BlueSense legítimo;
3. quien solicita la vinculación tiene acceso al dispositivo físico y este puede demostrar posesión de su material de alta;
4. la cuenta todavía no tiene otro dispositivo;
5. el dispositivo todavía no tiene propietario;
6. la prueba es reciente, corresponde a esa cuenta y no fue consumida;
7. la credencial usada después para telemetría es distinta de la prueba de alta.

## Alternativas consideradas

| Alternativa                                                                   | Ventajas                                                                                                                                                       | Límites y riesgos                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código secreto estático en el QR, consumido al vincular                       | Implementación y fabricación sencillas; no requiere criptografía BLE para la primera prueba.                                                                   | Una fotografía o copia previa del QR permite competir por el dispositivo. El QR pasa a contener un secreto y se aproxima demasiado a ser el único factor físico. Exige proteger el código en impresión, soporte y almacenamiento.                                      |
| Secreto simétrico de alta dentro del dispositivo; respuesta HMAC a un desafío | El QR puede seguir siendo público y la prueba requiere al dispositivo.                                                                                         | El backend debe conservar o recuperar un secreto equivalente para verificar HMAC. La inyección, cifrado, rotación y acceso operacional a esos secretos aumentan el riesgo y todavía dependen del hardware.                                                             |
| Clave asimétrica de alta dentro del dispositivo; firma de desafío             | El backend almacena sólo material público. Copiar el QR no basta. Los desafíos caducables evitan replay y la clave de alta puede retirarse tras el primer uso. | Requiere generación y almacenamiento no exportable o suficientemente protegido en el dispositivo, una biblioteca y algoritmo compatibles, un proceso de fábrica confiable y BLE/firmware reales. No impide clonación si la clave privada puede extraerse del hardware. |

## Recomendación pendiente de aprobación

Se recomienda la tercera alternativa: **desafío de un solo uso firmado por una credencial asimétrica de alta registrada previamente**, transportado entre app y dispositivo mediante BLE.

La recomendación no elige todavía algoritmo, curva, biblioteca ni almacenamiento seguro. Esas decisiones requieren registrar el modelo exacto del ESP32 y comprobar sus capacidades. El backend debe aceptar sólo una lista explícita de algoritmos aprobados cuando esa evaluación exista.

### Razones

- Mantiene el QR libre de secretos reutilizables.
- Exige una cuenta Firebase válida y acceso al dispositivo físico.
- Permite verificar la prueba con una clave pública.
- Vincula la prueba a un intento, dispositivo, cuenta y vencimiento concretos.
- Permite separar y retirar la credencial de alta sin retirar la credencial de telemetría.
- Puede probarse en backend con claves efímeras exclusivas de test antes de disponer del hardware, sin habilitar una vinculación ficticia en producción.

### Límite físico

BLE demuestra proximidad, no necesariamente posesión legítima. Se recomienda que el servicio de alta sólo esté disponible durante un modo físico de vinculación breve. El disparador exacto —por ejemplo, botón o acción local equivalente— depende del hardware y no se da por aprobado en esta propuesta.

## Registro inicial de un dispositivo legítimo

El registro inicial no sería una ruta pública de la app. Formaría parte de un proceso confiable de fabricación o preparación:

1. Se asigna un `deviceId` único y no secreto.
2. El dispositivo genera o recibe una credencial asimétrica exclusiva de alta.
3. La parte privada permanece en el dispositivo y no se copia a Firestore, la app, logs ni documentación.
4. Una herramienta administrativa de fábrica registra en Firestore el `deviceId`, la clave pública, su identificador/huella, el algoritmo y el estado `UNCLAIMED`.
5. El registro se confirma antes de imprimir o asociar el QR.
6. No se expone un endpoint autenticado como usuario para crear dispositivos legítimos.

La herramienta, identidad administrativa y procedimiento de fábrica son requisitos futuros. Esta propuesta no genera ni solicita claves privadas.

## Contenido propuesto del QR

El QR sólo contendría datos públicos y versionados:

```ts
interface DeviceQrPayloadV1 {
  version: 1;
  issuer: "BlueSense";
  projectId: "bluesense-347f0";
  deviceId: string;
  enrollmentKeyId: string;
  enrollmentKeyFingerprint: string;
}
```

No contendría:

- credencial privada de alta;
- credencial de telemetría;
- contraseña Wi-Fi;
- Firebase token o UID;
- URL de backend controlable por el QR;
- secreto reutilizable.

La app siempre usa su backend configurado. El backend compara versión, proyecto, `deviceId`, identificador y huella con el registro. Una copia del QR puede iniciar un intento, pero no completar la firma BLE.

## Separación de credenciales

### Credencial de alta

- Existe antes del primer propietario.
- Sólo firma desafíos de vinculación con separación de dominio.
- Su material público se registra durante fabricación.
- Después de una vinculación correcta se marca `CONSUMED` y no autoriza otra vinculación.
- No autentica telemetría.

### Credencial de telemetría

- Es diferente de la credencial de alta.
- La recomendación es que el dispositivo genere un segundo par de claves durante el aprovisionamiento y nunca exporte su parte privada.
- Su clave pública y metadatos se incluyen en la prueba final de alta.
- La firma de alta vincula el desafío con la huella de la nueva credencial de telemetría; una segunda firma demuestra que el dispositivo posee también la parte privada de telemetría.
- El backend guarda únicamente material público y metadatos de estado.
- El protocolo exacto de autenticación de cada mensaje de telemetría se define en otro bloque; HTTPS/TLS sigue siendo obligatorio.

Si el hardware no soporta esta opción, deberá revisarse por separado una credencial simétrica de telemetría y su entrega cifrada. No se reutilizará la credencial de alta como atajo.

## Secuencia propuesta

### A. Preparación confiable

```text
Dispositivo/herramienta de fábrica
  → crea identidad de alta en el dispositivo
  → registra sólo clave pública + deviceId en el backend/Firestore
  → asocia QR público
```

### B. Vinculación por la persona usuaria

```text
App autenticada
  → escanea QR público
  → entra al modo de vinculación del dispositivo
  → descubre por BLE el dispositivo esperado
  → lee identidad pública BLE y descriptor de telemetría
  → POST /device-link-attempts

Backend
  → verifica Firebase ID token
  → verifica QR/registro, cuenta libre y dispositivo no vinculado
  → crea intento idempotente con desafío aleatorio y vencimiento
  → devuelve challenge opaco

App
  → entrega challenge al dispositivo por BLE

Dispositivo
  → firma challenge + vínculo a credencial de telemetría con clave de alta
  → demuestra posesión de la clave de telemetría
  → devuelve sólo material público y firmas

App
  → POST /device-link-attempts/:attemptId/complete

Backend
  → verifica ambas pruebas
  → ejecuta una transacción Firestore
  → asigna un único propietario
  → consume intento y credencial de alta
  → registra material público de telemetría
  → devuelve dispositivo vinculado

App
  → habilita el siguiente paso: configurar depósito
```

Configurar Wi-Fi y completar el aprovisionamiento operativo siguen dependiendo de BLE y firmware. Vinculado no debe interpretarse automáticamente como conectado o enviando telemetría.

## Contratos de API propuestos

Todas las rutas de usuario requieren Firebase Bearer token verificado. Ningún contrato acepta `ownerUid` desde la app.

### `GET /devices/current`

- `200`: dispositivo de la cuenta, sin credenciales privadas.
- `404 DEVICE_NOT_LINKED`: la cuenta no tiene dispositivo.
- `401 UNAUTHORIZED`: token ausente o inválido.

### `POST /device-link-attempts`

```ts
interface CreateDeviceLinkAttemptRequest {
  requestId: string;
  qr: DeviceQrPayloadV1;
  telemetryCredential: {
    keyId: string;
    algorithm: string;
    publicKey: string;
    fingerprint: string;
  };
}
```

`requestId` es una clave opaca de idempotencia generada por la app. El backend deriva la cuenta del token.

Respuesta `201` —o `200` al repetir el mismo `requestId`—:

```ts
interface DeviceLinkAttemptResponse {
  attemptId: string;
  deviceId: string;
  challenge: string;
  expiresAt: string;
}
```

El `challenge` es Base64URL de bytes canónicos generados por el backend. Vincula como mínimo proyecto, versión de protocolo, intento, dispositivo, cuenta autenticada, vencimiento y huella de telemetría. El dispositivo firma los bytes; no necesita interpretarlos.

### `POST /device-link-attempts/:attemptId/complete`

```ts
interface CompleteDeviceLinkAttemptRequest {
  enrollmentProof: {
    keyId: string;
    algorithm: string;
    signature: string;
  };
  telemetryProof: {
    keyId: string;
    algorithm: string;
    signature: string;
  };
}
```

- `201`: vínculo creado.
- `200`: reintento idempotente del mismo intento ya completado por la misma cuenta.
- La respuesta contiene estado e identificadores públicos; nunca credenciales privadas o firmas reutilizables.

### Resultados de error

| HTTP/código                      | Significado                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `400 INVALID_QR`                 | Estructura, versión, proyecto o huella del QR no coincide.                                                            |
| `401 UNAUTHORIZED`               | Cuenta no autenticada o token inválido.                                                                               |
| `404 DEVICE_NOT_FOUND`           | El `deviceId` no fue registrado por el proceso confiable.                                                             |
| `404 LINK_ATTEMPT_NOT_FOUND`     | El intento no existe o no pertenece a la cuenta.                                                                      |
| `409 ACCOUNT_ALREADY_HAS_DEVICE` | La cuenta ya tiene su dispositivo MVP.                                                                                |
| `409 DEVICE_ALREADY_LINKED`      | Otro propietario ya vinculó el dispositivo. No se transfiere.                                                         |
| `409 LINK_ATTEMPT_CONSUMED`      | El intento fue consumido y no corresponde a un reintento idempotente válido.                                          |
| `410 LINK_ATTEMPT_EXPIRED`       | El desafío venció; debe iniciarse otro intento.                                                                       |
| `422 DEVICE_PROOF_INVALID`       | Firma, algoritmo, clave o vínculo de telemetría inválidos.                                                            |
| `503 SERVICE_UNAVAILABLE`        | Fallo transitorio de persistencia o dependencia; no se afirma que el vínculo haya fallado hasta consultar/reintentar. |

Los logs no incluirán challenges completos, firmas, claves, tokens ni credenciales. Los errores públicos no revelarán detalles criptográficos.

## Modelo propuesto en Firestore

### `devices/{deviceId}`

```text
deviceId
registrationStatus: UNCLAIMED | LINKED
ownerUid: string | null
enrollmentCredential:
  keyId
  algorithm
  publicKey
  fingerprint
  status: ACTIVE | CONSUMED
telemetryCredential: null | {
  keyId
  algorithm
  publicKey
  fingerprint
  status: ACTIVE
}
firmwareVersion: string | null
createdAt
linkedAt: timestamp | null
updatedAt
```

`deviceCredential` del modelo conceptual debe representarse en implementación como metadatos/material público o referencia segura, nunca como una credencial privada en texto plano.

### `accountDeviceLinks/{uid}`

```text
uid
deviceId
linkedAt
```

El documento se identifica por UID. Su existencia impone como máximo un dispositivo por cuenta sin depender de una consulta de unicidad.

### `deviceLinkAttempts/{attemptId}`

```text
attemptId
uid
deviceId
requestIdHash
challenge
telemetryCredentialDescriptor
status: PENDING | CONSUMED | EXPIRED
createdAt
expiresAt
consumedAt: timestamp | null
```

El desafío no es una credencial permanente, pero se trata como dato operacional sensible y no se muestra en logs. Los intentos vencidos pueden limpiarse después; una política TTL sería una optimización futura, no parte necesaria de la corrección de seguridad.

El backend deriva `attemptId` de forma determinista y no reversible a partir del UID autenticado y `requestId`, con separación de dominio. La creación se ejecuta transaccionalmente: si el documento ya existe y pertenece a los mismos datos, se devuelve; si hay una colisión o datos discordantes, se rechaza. Para iniciar un intento nuevo después de vencer, la app genera otro `requestId`.

No se requieren índices compuestos para los accesos por ID propuestos. No se cambia la regla que niega acceso directo a clientes.

## Atomicidad y concurrencia

La finalización usa una única transacción Firestore:

1. Lee `accountDeviceLinks/{uid}`.
2. Lee `devices/{deviceId}`.
3. Lee `deviceLinkAttempts/{attemptId}`.
4. Comprueba cuenta sin vínculo, dispositivo `UNCLAIMED`, propietario nulo, credencial de alta `ACTIVE`, intento `PENDING`, UID/dispositivo coincidentes y vencimiento vigente.
5. Crea `accountDeviceLinks/{uid}`.
6. Actualiza el dispositivo a `LINKED`, fija `ownerUid`, consume la credencial de alta y registra el material público de telemetría.
7. Marca el intento `CONSUMED`.

Firestore vuelve a ejecutar una transacción cuando una lectura cambia concurrentemente y no aplica escrituras parciales. Al usar documentos deterministas por UID y `deviceId`, dos solicitudes concurrentes no pueden crear dos vínculos válidos: sólo una transacción puede observar y cambiar el estado esperado; la otra termina en conflicto de dominio tras el reintento.

Las firmas se verifican antes de escribir, pero las precondiciones de propiedad y consumo se vuelven a validar dentro de la transacción.

## Reintentos y fallos parciales

- **Se repite la creación con el mismo `requestId`:** devuelve el mismo intento y desafío mientras siga siendo válido; no crea pruebas ilimitadas por un fallo de red.
- **La app pierde BLE antes de completar:** no existe vínculo. El intento vence y puede reemplazarse.
- **Dos cuentas crean intentos para el mismo dispositivo:** pueden obtener desafíos, pero la transacción final concede como máximo un propietario.
- **La transacción confirma y se pierde la respuesta:** repetir `complete` con la misma cuenta e intento devuelve el vínculo existente como éxito idempotente.
- **Se repite una prueba consumida desde otra cuenta:** se rechaza; nunca transfiere el dispositivo.
- **Falla Firestore antes del commit:** no queda ningún documento parcialmente vinculado.
- **Falla el aprovisionamiento Wi-Fi después del vínculo:** el propietario se conserva y el flujo reanuda aprovisionamiento; no se crea otro vínculo.
- **Prueba inválida o vencida:** no cambia propiedad, credenciales ni relación de cuenta.

Debe limitarse la frecuencia de creación y finalización por UID, dispositivo e IP, pero los valores concretos se definirán con requisitos operativos; no se inventa un umbral aquí.

## Dependencias de BLE, firmware y hardware

La implementación física necesita definir y validar:

- modelo exacto de ESP32 y capacidad de almacenamiento protegido/no exportable;
- algoritmo y biblioteca criptográfica soportados;
- fuente de aleatoriedad y generación de claves;
- proceso de registro en fabricación;
- disparador y duración del modo físico de vinculación;
- UUID de servicio/características BLE, publicidad, MTU, fragmentación y reanudación;
- permisos y comportamiento Bluetooth en iOS y Android;
- protección del transporte BLE al configurar Wi-Fi;
- estados de firmware ante reinicio, pérdida de energía y reintentos.

Expo Go sólo permite módulos nativos incluidos en Expo SDK o librerías sin código nativo personalizado. Si la librería BLE elegida requiere código nativo, la validación física necesitará un development build; no se añadirá una dependencia BLE hasta evaluarla.

## Primer bloque comprobable sin hardware

Se recomienda comenzar sólo con backend y pruebas, después de aprobar esta propuesta:

1. Tipos y reglas de dominio para intentos, estados, errores e idempotencia.
2. Interfaces inyectables para repositorio y verificador de prueba de dispositivo.
3. Servicio transaccional de vinculación.
4. Adaptador Firestore y pruebas contra Firestore Emulator.
5. Contratos HTTP con autenticación Firebase simulada por los dobles existentes.
6. Simulador exclusivo de test que genere claves efímeras, registre un dispositivo ficticio sólo en el emulador y firme desafíos.
7. Pruebas de concurrencia, replay, vencimiento y recuperación.

No incluiría todavía:

- pantalla de éxito que finja hardware;
- bypass de prueba habilitable en producción;
- escritura en el Firestore real;
- firmware, BLE, Wi-Fi o telemetría;
- transferencia o desvinculación;
- configuración del depósito antes de un vínculo real.

El verificador de producción debe fallar cerrado si no existe un mecanismo criptográfico aprobado. Los datos simulados y claves efímeras viven únicamente en tests/emulador.

## Pruebas y evidencias

### Automatizables sin hardware

- autenticación requerida en todas las rutas;
- dispositivo inexistente, QR discordante, prueba inválida y desafío vencido;
- cuenta ya vinculada y dispositivo ya vinculado;
- consumo de prueba y rechazo de replay;
- repetición idempotente tras pérdida de respuesta;
- dos cuentas compitiendo por un dispositivo;
- una cuenta intentando dos dispositivos;
- rollback sin escrituras parciales;
- separación de clave de alta y clave pública de telemetría;
- ausencia de secretos en respuestas y logs;
- repositorio en memoria para unidad y Firestore Emulator para transacción real.

El simulador demuestra contratos y concurrencia, no demuestra seguridad del ESP32, BLE real ni almacenamiento de claves.

### Pendientes de hardware real

- escaneo del QR impreso;
- entrada física al modo de vinculación;
- descubrimiento y selección BLE del dispositivo correcto;
- firma dentro del ESP32 sin exportar claves;
- interrupción/reanudación por Bluetooth, app cerrada, reinicio y pérdida de energía;
- permisos y comportamiento en iPhone y Android;
- aprovisionamiento Wi-Fi seguro;
- autenticación de telemetría por HTTPS;
- resistencia del almacenamiento de claves y proceso de fábrica.

## Criterios de aceptación propuestos

- Un QR copiado sin acceso al dispositivo no completa el vínculo.
- Un `deviceId` conocido no autoriza vinculación.
- Sólo dispositivos pre-registrados pueden iniciar un intento válido.
- Una cuenta autenticada obtiene como máximo un dispositivo.
- Un dispositivo obtiene como máximo un propietario.
- La prueba está ligada a cuenta, dispositivo, intento, vencimiento y credencial de telemetría.
- Un intento consumido o vencido no crea otro vínculo.
- Los reintentos del mismo resultado no duplican documentos ni cambian propietario.
- Alta y telemetría usan credenciales diferentes.
- Ninguna credencial privada aparece en QR, app, API, Firestore, logs o repositorio.
- La app no accede directamente a Firestore.
- Sólo un vínculo confirmado habilita la posterior configuración del depósito.
- Las pruebas con simulador se etiquetan como tales y no se presentan como emparejamiento físico.

## Firestore, identidad del backend y dependencias

### Acceso

- Se usa la base `(default)` existente de `bluesense-347f0` en `northamerica-south1`.
- Se conservan las reglas `allow read, write: if false` para clientes.
- Las bibliotecas de servidor omiten Security Rules y se autorizan mediante IAM; por eso la autorización por UID y dispositivo debe permanecer en el backend.
- En despliegue se recomienda ADC con una identidad de carga de trabajo/servicio adjunta y el rol mínimo de lectura/escritura de datos, como `roles/datastore.user`, no una clave privada descargada.
- En desarrollo automatizado se usa `FIRESTORE_EMULATOR_HOST` y un project ID consistente. El emulador no requiere credenciales de producción.
- Esta propuesta no cambia IAM, reglas, facturación ni la base real.

### Evaluación de dependencias

`firebase-admin@14.5.0` ya incorpora `@google-cloud/firestore@9.4.0`; no se propone una dependencia nueva para el backend. Esa cadena resuelve `@grpc/grpc-js@1.14.7`, mientras que el hallazgo high documentado en `docs/auth.md` corresponde a `@grpc/grpc-js@1.9.16` instalado por el metapaquete Firebase móvil.

Usar Firestore en el backend activará por primera vez esa cadena Admin/Google Cloud. Antes de implementar debe actualizarse la revisión de advisories y registrarse la aceptación temporal de los hallazgos que sigan abiertos, tal como exige `docs/auth.md`. No debe importarse Firestore en la app móvil: además de romper la arquitectura, activaría la ruta móvil cuya vulnerabilidad sigue sin corrección compatible documentada.

## Decisiones solicitadas

1. Aprobar o rechazar la recomendación de desafío BLE firmado con credencial asimétrica de alta y credencial asimétrica de telemetría separada.
2. Aprobar que el alta legítima sea exclusivamente un proceso confiable de fabricación/administración, sin endpoint público para registrar dispositivos.
3. Confirmar que el primer bloque implementable será backend + Firestore Emulator + simulador exclusivo de tests, sin UI de vinculación ni escritura en producción.
4. Definir, cuando se registre el modelo de ESP32, qué acción física habilitará temporalmente el modo de vinculación. Sin una presencia física controlada, BLE por sí solo no se considerará prueba suficiente.

## Fuentes oficiales

- [Cloud Firestore: transacciones y escrituras por lotes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Cloud Firestore: condiciones de Security Rules y bibliotecas de servidor](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Cloud Firestore: IAM](https://firebase.google.com/docs/firestore/security/iam)
- [Firebase Admin SDK: configuración y Application Default Credentials](https://firebase.google.com/docs/admin/setup)
- [Firebase Local Emulator Suite: conectar Firestore](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Cloud Firestore: políticas TTL](https://firebase.google.com/docs/firestore/ttl)
- [Expo: añadir código nativo y límites de Expo Go](https://docs.expo.dev/workflow/customizing/)
