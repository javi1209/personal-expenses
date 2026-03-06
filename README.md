# Gastos App

App web para controlar gastos personales, presupuestos y gastos compartidos.

## Que incluye

- Dashboard con alertas y resumen del mes
- CRUD de gastos con filtros por mes y categoria
- Presupuestos por categoria con umbral de alerta
- Gastos compartidos con estado de pago y tiempo real
- Reportes visuales (distribucion, presupuesto vs gastado, tendencia)
- Estados UX de carga/vacio/error mas claros en pantallas de datos
- Preferencias de locale y moneda configurables desde la barra lateral
- Backend Express + MongoDB con validaciones de payload

## Stack

- Frontend: React + TypeScript + Vite + Zustand + Recharts
- Backend: Node.js + Express + Mongoose + Socket.IO + Helmet + Rate Limit

## Inicio rapido

### Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- MongoDB (local o remoto)

### 1) Instalar dependencias

```bash
npm install
```

Para correr E2E en Playwright (una sola vez por maquina):

```bash
npm run playwright:install
```

### 2) Configurar entorno

Crea `.env` desde `.env.example`:

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

Notas de seguridad:

- En produccion `JWT_SECRET` debe tener al menos 32 caracteres.
- En produccion `CORS_ORIGIN` y `MONGODB_URI` son obligatorios.
- Las rutas de datos requieren JWT: usa registro/login desde la UI para obtener sesion.

### 3) Levantar backend

```bash
npm run server
```

### 4) Levantar frontend

En otra terminal:

```bash
npm run dev
```

App: `http://localhost:5173` (o siguiente puerto disponible).

Alternativa (todo junto):

```bash
npm run dev:full
```

Este comando levanta:
- MongoDB local (si no hay uno corriendo en `127.0.0.1:27017`)
- backend (`/api` en `http://127.0.0.1:5000`)
- frontend Vite (`http://127.0.0.1:5173`)

Para detener todo: `Ctrl+C`.

### 5) Registrar usuario

En la pantalla inicial puedes:

- crear cuenta (`register`)
- iniciar sesion (`login`)

El backend filtra todos los datos por `userId` del token JWT.

## Scripts

- `npm run dev`: frontend en desarrollo
- `npm run dev:full`: Mongo + backend + frontend en un comando
- `npm run server`: backend
- `npm run build`: build de produccion
- `npm run preview`: preview del build
- `npm run test`: ejecuta tests con Vitest
- `npm run test:api`: integracion API real (Express + Mongo en memoria + supertest)
- `npm run test:watch`: tests en modo watch
- `npm run test:coverage`: tests con reporte de cobertura
- `npm run test:e2e`: E2E UI reales con Playwright (levanta frontend + backend + Mongo en memoria)
- `npm run test:e2e:headed`: igual que `test:e2e` pero con navegador visible
- `npm run test:e2e:ui`: runner interactivo de Playwright
- `npm run lint`: lint

## Deploy en GitHub Pages

Este repo ya incluye workflow en `.github/workflows/pages.yml`.

Importante:
- GitHub Pages sirve solo el frontend estatico.
- El backend (Express + Mongo) debe estar desplegado aparte.

### Pasos

1. En GitHub, abre `Settings > Pages` y en `Build and deployment` selecciona `GitHub Actions`.
2. En `Settings > Secrets and variables > Actions > Variables`, crea:
   - `VITE_API_BASE_URL`: URL publica de tu API, por ejemplo `https://tu-backend.com/api`
   - `VITE_SOCKET_URL`: URL publica base para Socket.IO, por ejemplo `https://tu-backend.com`
3. Haz push a `main` o `master` (o ejecuta manualmente `Deploy Pages` desde `Actions`).

El workflow construye `dist`, genera `dist/404.html` para rutas SPA y publica en Pages.

## Deploy en Vercel

El proyecto ya incluye `vercel.json` para enrutar:
- `/api/*` a la function `api/index.js`
- `/*` a `index.html` (SPA fallback)

### Variables necesarias en Vercel

En `Project > Settings > Environment Variables`:
- `NODE_ENV=production`
- `MONGODB_URI=<tu-uri-de-mongodb>`
- `JWT_SECRET=<minimo-32-caracteres>`
- `CORS_ORIGIN=https://tu-app.vercel.app`
- `VITE_ENABLE_REALTIME=false` (recomendado en Vercel Serverless)

Opcionales:
- `JWT_EXPIRES_IN=7d`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=300`
- `JSON_BODY_LIMIT=100kb`

Nota: en Vercel Functions no hay WebSocket persistente; por eso se recomienda desactivar realtime.

## Documentacion

- Documentacion tecnica completa: [docs/arquitectura.md](docs/arquitectura.md)

Incluye arquitectura, API, validaciones backend, modelo de datos, comportamiento en fallback y troubleshooting.
