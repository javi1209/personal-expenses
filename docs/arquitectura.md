# Arquitectura y Referencia Tecnica

Aplicacion web para control de finanzas personales con enfoque en:

- registro y seguimiento de gastos
- presupuestos por categoria con alertas
- gestion de gastos compartidos
- reportes visuales
- sincronizacion en tiempo real para compartidos

La interfaz usa una tematica estilo "Game of Thrones" y esta construida como SPA con React + Vite.

## Tabla de contenido

1. [Que hace la app](#que-hace-la-app)
2. [Stack tecnologico](#stack-tecnologico)
3. [Arquitectura general](#arquitectura-general)
4. [Funcionalidades por modulo](#funcionalidades-por-modulo)
5. [Como usar la app (flujo recomendado)](#como-usar-la-app-flujo-recomendado)
6. [Instalacion y ejecucion local](#instalacion-y-ejecucion-local)
7. [Variables de entorno](#variables-de-entorno)
8. [Scripts disponibles](#scripts-disponibles)
9. [API backend](#api-backend)
10. [Eventos en tiempo real (Socket.IO)](#eventos-en-tiempo-real-socketio)
11. [Modelo de datos](#modelo-de-datos)
12. [Estructura del proyecto](#estructura-del-proyecto)
13. [Comportamiento sin backend o sin base de datos](#comportamiento-sin-backend-o-sin-base-de-datos)
14. [Limitaciones actuales](#limitaciones-actuales)
15. [Solucion de problemas](#solucion-de-problemas)

## Que hace la app

Permite gestionar gastos personales desde 6 modulos principales:

- `Dashboard`: resumen financiero del mes, alertas y gastos recientes.
- `Gastos`: CRUD completo de gastos con filtros por mes y categoria (meses dinamicos).
- `Categorias`: totales por categoria y comparativa visual.
- `Presupuestos`: creacion y eliminacion de presupuestos por categoria con umbral de alerta y gasto real sincronizado.
- `Compartidos`: registro de gastos grupales y seguimiento de quien ya pago.
- `Reportes`: graficas de distribucion, presupuesto vs gastado y tendencia mensual basada en datos reales.

Tambien incluye:

- notificaciones toast
- panel lateral de alertas
- soporte PWA (manifest + service worker via VitePWA)
- backend Express con MongoDB
- sincronizacion de gastos compartidos via Socket.IO

## Stack tecnologico

### Frontend

- React 18 + TypeScript
- Vite 6
- React Router DOM
- Zustand (estado global)
- Recharts (graficas)
- react-hot-toast (notificaciones)
- date-fns (fechas)
- lucide-react (iconos)

### Backend

- Node.js + Express
- Mongoose + MongoDB
- Socket.IO
- jsonwebtoken + bcryptjs (autenticacion JWT)
- dotenv + cors
- helmet + express-rate-limit
- express-mongo-sanitize + sanitizacion de strings

### Tooling

- TypeScript
- ESLint
- Vite Plugin PWA

## Arquitectura general

1. El frontend corre en Vite (`localhost:5173` por defecto).
2. El backend corre en Express (`localhost:5000` por defecto).
3. Vite proxea:
   - `/api` -> `http://localhost:5000`
   - `/socket.io` -> `http://localhost:5000`
4. El frontend consume REST para datos y Socket.IO para eventos en gastos compartidos.

## Funcionalidades por modulo

### 1) Dashboard (`/`)

Muestra un resumen del estado financiero:

- gastado este mes
- total presupuestado
- disponible estimado (`presupuestado - gastado`)
- cantidad de alertas urgentes
- lista de alertas recientes
- lista de gastos recientes

Alertas consideradas:

- vencimientos de cuentas en los proximos 7 dias
- presupuestos al borde del umbral
- presupuestos excedidos

### 2) Gastos (`/gastos`)

Permite administrar gastos personales:

- crear gasto
- editar gasto
- eliminar gasto
- filtrar por mes (lista dinamica con meses recientes y meses presentes en datos)
- filtrar por categoria
- ver total del periodo filtrado

Campos soportados por gasto:

- descripcion
- monto
- fecha
- categoria
- notas (opcional)
- `esRecurrente` (boolean)
- `cuentaVence` (fecha, opcional)
- `esCompartido` (boolean)

### 3) Categorias (`/categorias`)

Vista agregada por categoria:

- total gastado por categoria
- cantidad de gastos por categoria
- barra de comparacion relativa entre categorias

### 4) Presupuestos (`/presupuestos`)

Permite gestionar presupuestos por categoria:

- crear presupuesto
- eliminar presupuesto
- definir periodo (`mensual`, `semanal`, `anual`)
- definir `alertaUmbral` (%)
- recalculo automatico de `montoGastado` al crear/editar/eliminar gastos
- ver porcentaje usado y estado visual:
  - normal
  - alerta (al llegar al umbral)
  - excedido (>= 100%)

### 5) Compartidos (`/compartidos`)

Gestion de gastos entre varias personas:

- crear gasto compartido
- agregar multiples participantes
- registrar cuanto debe cada participante
- marcar participantes como pagados
- estado automatico del gasto:
  - `pendiente`
  - `parcial`
  - `saldado`
- sincronizacion en tiempo real entre clientes conectados

### 6) Reportes (`/reportes`)

Incluye visualizaciones con Recharts:

- pie chart: distribucion de gasto por categoria
- bar chart: presupuesto vs gastado real por categoria
- line chart: tendencia mensual real (ultimos meses)
- tabla resumen por categoria (gastos, total y porcentaje)

## Como usar la app (flujo recomendado)

1. Entra a `Presupuestos` y crea tus limites por categoria.
2. Ve a `Gastos` y registra tus gastos diarios.
3. Marca como recurrentes los gastos que vencen mes a mes.
4. Revisa el `Dashboard` para detectar alertas urgentes.
5. Si compartes pagos, usa `Compartidos` para dividir y marcar pagos.
6. Consulta `Reportes` para analizar distribucion y tendencia.

## Instalacion y ejecucion local

### Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- MongoDB local o remoto (opcional para iniciar, recomendado para persistencia real)

### 1) Instalar dependencias

```bash
npm install
```

### 2) Configurar entorno

Crear `.env` a partir de `.env.example`.

Ejemplo:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gastos-app
JWT_SECRET=replace-with-a-strong-secret-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
JSON_BODY_LIMIT=100kb
```

### 3) Levantar backend

```bash
npm run server
```

Backend disponible en:

- `http://localhost:5000`

### 4) Levantar frontend

En otra terminal:

```bash
npm run dev
```

Frontend disponible en:

- `http://localhost:5173`
- si ese puerto esta ocupado, Vite usa otro automaticamente (por ejemplo `5174`, `5175`, etc.)

## Variables de entorno

Variables leidas por el backend:

- `MONGODB_URI`: conexion a MongoDB.
- `PORT`: puerto HTTP del backend.
- `NODE_ENV`: habilita validaciones estrictas en `production`.
- `JWT_SECRET`: secreto para auth (requerido en `production`, minimo 32 chars).
- `JWT_EXPIRES_IN`: expiracion del token JWT (ejemplo `7d`, `12h`).
- `CORS_ORIGIN`: allowlist de origenes permitidos (coma separado, requerido en `production`).
- `RATE_LIMIT_WINDOW_MS`: ventana de tiempo para rate limit global de `/api`.
- `RATE_LIMIT_MAX`: maximo de requests por IP dentro de la ventana.
- `JSON_BODY_LIMIT`: limite maximo de body JSON/URL-encoded.

## Scripts disponibles

- `npm run dev`: inicia frontend con Vite.
- `npm run build`: compila TypeScript y build de produccion.
- `npm run preview`: sirve el build generado por Vite.
- `npm run lint`: corre ESLint.
- `npm run server`: inicia backend Express.
- `npm start`: alias de `npm run server`.

## API backend

Base URL local: `http://localhost:5000/api`

### Autenticacion

- `POST /api/auth/register` -> crea usuario y devuelve token JWT
- `POST /api/auth/login` -> inicia sesion y devuelve token JWT
- `GET /api/auth/me` -> devuelve usuario autenticado actual

Todas las rutas de datos (`/api/gastos`, `/api/compartidos`, `/api/presupuestos`) requieren:

```http
Authorization: Bearer <token>
```

### Validaciones y errores

El backend valida payloads de escritura y devuelve `400` cuando algo no cumple reglas.

Respuesta de error estandar:

```json
{
  "message": "Descripcion del error"
}
```

Payload ejemplo (registro):

```json
{
  "nombre": "Javier",
  "email": "javier@example.com",
  "password": "superpassword123"
}
```

Payload ejemplo (login):

```json
{
  "email": "javier@example.com",
  "password": "superpassword123"
}
```

Reglas principales implementadas:

- validacion de `ObjectId` en rutas con `:id`
- rechazo de campos no permitidos por endpoint
- validacion de tipos (string/number/boolean/fecha)
- categorias limitadas a las soportadas por la app
- montos > 0 para gastos/presupuestos/participantes
- `alertaUmbral` entre 1 y 100
- en compartidos, suma de participantes = `montoTotal`
- en compartidos, nombres de participantes sin duplicados

### Gastos

- `GET /api/gastos` -> lista gastos
- `POST /api/gastos` -> crea gasto
- `PUT /api/gastos/:id` -> actualiza gasto
- `DELETE /api/gastos/:id` -> elimina gasto

Payload ejemplo (crear gasto):

```json
{
  "descripcion": "Supermercado",
  "monto": 1450,
  "fecha": "2026-03-03",
  "categoria": "alimentacion",
  "notas": "Compra semanal",
  "esRecurrente": false,
  "cuentaVence": "",
  "esCompartido": false
}
```

Nota: `categoriaLabel` se normaliza en backend segun la categoria.

### Gastos compartidos

- `GET /api/compartidos` -> lista gastos compartidos
- `POST /api/compartidos` -> crea gasto compartido
- `POST /api/compartidos/:id/pagar` -> marca un participante como pagado

Payload ejemplo (crear compartido):

```json
{
  "descripcion": "Cena",
  "montoTotal": 1800,
  "fecha": "2026-03-03",
  "categoria": "alimentacion",
  "pagadoPor": "Ana",
  "participantes": [
    { "nombre": "Ana", "monto": 600, "pagado": true },
    { "nombre": "Luis", "monto": 600, "pagado": false },
    { "nombre": "Marta", "monto": 600, "pagado": false }
  ],
  "notas": "Cumpleanos"
}
```

Nota: `estado` se calcula en backend a partir de los participantes.

Payload ejemplo (marcar pagado):

```json
{
  "participante": "Luis"
}
```

### Presupuestos

- `GET /api/presupuestos` -> lista presupuestos
- `POST /api/presupuestos` -> crea presupuesto
- `PUT /api/presupuestos/:id` -> actualiza presupuesto
- `DELETE /api/presupuestos/:id` -> elimina presupuesto

Payload ejemplo (crear presupuesto):

```json
{
  "categoria": "transporte",
  "montoLimite": 3000,
  "periodo": "mensual",
  "alertaUmbral": 80,
  "color": "#3b82f6"
}
```

Notas:

- `montoGastado` lo calcula backend usando los gastos reales de esa categoria.
- `categoriaLabel` y `color` pueden inferirse automaticamente por categoria.

## Eventos en tiempo real (Socket.IO)

Cliente escucha:

- `gasto_compartido:nuevo`
- `gasto_compartido:actualizado`

Servidor emite:

- al crear gasto compartido: `gasto_compartido:nuevo`
- al marcar pago:
  - `gasto_compartido:participante_pagado`
  - `gasto_compartido:actualizado`

Nota: la conexion Socket.IO se autentica con el mismo JWT y los eventos se emiten por sala de usuario (`user:<id>`), sin mezclar datos entre cuentas.

## Modelo de datos

### Gasto

- `userId: ObjectId`
- `descripcion: string`
- `monto: number`
- `fecha: string (ISO)`
- `categoria: string`
- `categoriaLabel: string`
- `notas?: string`
- `esRecurrente: boolean`
- `cuentaVence?: string`
- `esCompartido: boolean`

### Presupuesto

- `userId: ObjectId`
- `categoria: string`
- `categoriaLabel: string`
- `montoLimite: number`
- `montoGastado: number`
- `periodo: mensual | semanal | anual`
- `alertaUmbral: number`
- `color: string`

### GastoCompartido

- `userId: ObjectId`
- `descripcion: string`
- `montoTotal: number`
- `fecha: string`
- `categoria: string`
- `pagadoPor: string`
- `estado: pendiente | parcial | saldado`
- `participantes[]`:
  - `nombre`
  - `email?`
  - `monto`
  - `pagado`
  - `pagadoEn?`
- `notas?`

### User

- `nombre: string`
- `email: string` (unico)
- `passwordHash: string`

## Estructura del proyecto

```text
.
|- server/
|  `- index.cjs               # API REST + Socket.IO + Mongo
|- src/
|  |- components/             # UI, layout, forms, alertas
|  |- pages/                  # Dashboard, Gastos, Categorias, Presupuestos, Compartidos, Reportes
|  |- store/                  # Zustand stores
|  |- services/               # API client + socket client
|  |- hooks/                  # useAlerts
|  |- data/                   # categorias y mock data fallback
|  |- styles/                 # design tokens CSS
|  |- types/                  # tipos TypeScript
|  |- App.tsx
|  `- main.tsx
|- public/
|  `- crown.svg
|- vite.config.ts             # proxy API/socket + PWA
|- package.json
`- .env.example
```

## Comportamiento sin backend o sin base de datos

### Si el frontend no puede cargar datos desde API

En la carga inicial, cada store tiene fallback a datos mock (`src/data/mockData.ts`):

- gastos -> `MOCK_GASTOS`
- presupuestos -> `MOCK_PRESUPUESTOS`
- compartidos -> `MOCK_COMPARTIDOS`

### Importante

- el fallback cubre carga inicial (`load*`)
- operaciones de escritura (crear/editar/eliminar/marcar pagado) siguen requiriendo backend
- en respuestas `401` no se aplica fallback mock; la sesion se invalida en cliente

### Si MongoDB falla al conectar

El backend intenta arrancar igual y queda escuchando en el puerto configurado, pero al no haber DB las operaciones de lectura/escritura pueden fallar.

### Sincronizacion de presupuestos

- al iniciar el backend, se sincroniza `montoGastado` de todos los presupuestos
- al crear/editar/eliminar un gasto, se recalculan los presupuestos de las categorias afectadas
- el frontend refresca presupuestos tras operaciones de gastos para reflejar el cambio al instante

## Limitaciones actuales

- En UI de presupuestos no hay editar, solo crear/eliminar (aunque API si soporta `PUT`).
- No hay suite de tests automatizados incluida en el repo.

## Solucion de problemas

### 1) El frontend no carga datos

Verifica que backend este corriendo:

```bash
npm run server
```

### 2) Error de conexion a MongoDB

- revisa `MONGODB_URI`
- confirma que Mongo este levantado
- prueba la URI con cliente externo

### 3) El puerto 5173 ya esta ocupado

Vite elige otro puerto automaticamente. Revisa la salida de `npm run dev`.

### 4) No veo actualizaciones en tiempo real en compartidos

- confirma que backend y frontend esten activos
- verifica proxy `/socket.io` en `vite.config.ts`
- revisa consola del backend para conexiones Socket.IO

### 5) Recibo errores 400 al guardar datos

- revisa que no envies campos extra no soportados por el endpoint
- valida tipos: montos numericos, fechas validas, booleanos correctos
- en compartidos, verifica que la suma de participantes coincida con `montoTotal`

