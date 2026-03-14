# AGENTS

## Proposito
- Guia rapida para agentes trabajando en Gastos App (React + Express + MongoDB).

## Estado del proyecto
- Frontend SPA con React 18 + TypeScript + Vite 6; estado global en Zustand; graficas con Recharts; PWA via VitePWA.
- Backend Express + MongoDB + Mongoose + Socket.IO; autenticacion JWT; rate limiting y sanitizacion.
- Tema visual "Game of Thrones"; conservar paleta, tipografia y micro-animaciones existentes (Framer Motion).
- Documentacion tecnica en `docs/arquitectura.md`; hoja de ruta en `implementaciones.md`.

## Setup y ejecucion
- Requisitos: Node 18+ (20 recomendado), npm, MongoDB accesible en `127.0.0.1:27017`.
- Instalar dependencias: `npm install`.
- Entorno: copiar `.env.example` a `.env` y completar `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, etc. No commitear `.env`.
- Desarrollo full stack: `npm run dev:full` (levanta Mongo local si no esta corriendo, backend en 5000 y frontend en 5173).
- Alternativas: backend `npm run server`; frontend `npm run dev`.
- Playwright: primera vez ejecutar `npm run playwright:install`.

## QA y calidad
- Lint: `npm run lint`.
- Unit/integration: `npm run test`.
- API real: `npm run test:api` (Mongo en memoria).
- Cobertura: `npm run test:coverage`.
- E2E UI: `npm run test:e2e` (`:headed` o `:ui` segun se necesite).
- Build check: `npm run build` y `npm run preview` antes de entregar.

## Arquitectura y convenciones
- Frontend en `src/` (pages, components, hooks, store, services). Usar servicios para llamadas HTTP y Zustand para estado compartido.
- Backend principal en `server/index.cjs`; version serverless para Vercel en `api/index.cjs`.
- Vite proxea `/api/*` y `/socket.io`; no hardcodear URLs, usar `src/config` y variables `VITE_API_BASE_URL` / `VITE_SOCKET_URL`.
- Respetar tipos en `src/types` y hooks utilitarios en `src/hooks`; mantener validaciones de payload en backend.
- No commitear artefactos generados (`dist/`, `coverage/`, `playwright-report/`, `test-results/`).

## Deploy
- GitHub Pages solo sirve el frontend (workflow en `.github/workflows/pages.yml`).
- Vercel usa `vercel.json`: `api/index.cjs` como function y fallback SPA a `index.html`. Configurar variables en el dashboard de Vercel (ver README).

## Datos y seeds
- La app espera MongoDB con datos por usuario; tests de API crean base temporal. No hay seed obligatoria; generar datos via UI o fixtures de tests segun necesidad.

## Checklist antes de PR
- Lint y tests relevantes pasan.
- Build local exitoso.
- Variables sensibles fuera del repo.
- Comportamiento responsive y animaciones intactas.
- Documentar cambios de API o configs en README o `docs/`.
