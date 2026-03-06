# Hoja de Ruta: Hacia una App de Producción

He reorganizado la lista por **Prioridad (P1 a P4)** para que tengas una guía clara de qué pasos dar para que la app sea realmente profesional y escalable.

## [P1] Estabilidad e Infraestructura ✅ Completo

- [X] **Operación y Despliegue**: Dockerización de la app, variables por entorno (dev/prod), logs estructurados y estrategia de backups de MongoDB.
- [X] **Sincronización de Preferencias**: Persistir locale, moneda y tema en el backend por usuario (`/user/settings`) para que la experiencia sea consistente en todos los dispositivos.

## [P2] Automatización y Gestión Avanzada ✅ Completo

- [X] ~~**Automatización de Recurrentes**: Proceso en el backend que genera automáticamente los gastos marcados como `esRecurrente` al inicio de cada mes. Implementado con `RecurrenteLog` (idempotente), trigger al arrancar el servidor, endpoint `POST /api/admin/generar-recurrentes` con botón en la UI de Gastos.~~

## [P3] Utilidad y Retención ✅ Completo

- [x] **Exportación de Datos**: Botón para descargar reportes en CSV o PDF para contabilidad personal fuera de la app.
- [x] **Búsqueda Global**: Buscador por descripción de gasto entre todos los meses disponibles.
- [x] **Filtros Avanzados**: Filtro por rango de montos (mínimo/máximo) en la lista de gastos.
- [x] **Notificaciones**: Avisos proactivos (Push o Email) cuando se registra un pago en un gasto compartido o cuando un presupuesto llega al 90%.

## [P4] Experiencia de Usuario y Pulido (Baja)

- [ ] **Micro-interacciones**: Agregar animaciones fluidas al abrir modales o al actualizar gráficos para esa sensación "premium".
- [ ] **Aumento de Cobertura de Tests**: Extender la suite de tests unitarios y E2E para cubrir los flujos de "Gastos Compartidos" y "Reportes".

---

### Completadas recientemente:

- [X] **Despliegue Full-Stack (Vercel)**: Configuración de Serverless Functions y ruteo SPA para despliegue gratuito sin tarjeta.
- [X] ~~**Modo Oscuro/Claro**: Selector de tema manual persistido en localStorage y sincronizado con el backend.~~
- [X] ~~**Datos y reportes reales**: Tendencia mensual calculada desde API real (`/reportes/tendencia`), no datos hardcodeados.~~
- [X] ~~**Gestión de Cuentas**: Manejo de múltiples billeteras con saldos reales y sincronización automática.~~
- [X] ~~**Edición de Presupuestos**: Interfaz para ajustar montos y alertas de presupuestos existentes.~~
- [X] ~~**Gastos Compartidos**: Página dedicada con lógica de división de gastos entre participantes.~~
