# Hoja de Ruta: Hacia una App de Producción

He reorganizado la lista por **Prioridad (P1 a P4)** para que tengas una guía clara de qué pasos dar para que la app sea realmente profesional y escalable.

## [P1] Estabilidad e Infraestructura ✅ Completo

- [X] **Operación y Despliegue**: Dockerización de la app, variables por entorno (dev/prod), logs estructurados y estrategia de backups de MongoDB.
- [X] **Sincronización de Preferencias**: Persistir locale, moneda y tema en el backend por usuario (`/user/settings`) para que la experiencia sea consistente en todos los dispositivos.

## [P2] Automatización y Gestión Avanzada ✅ Completo

- [X] ~~**Automatización de Recurrentes**: Proceso en el backend que genera automáticamente los gastos marcados como `esRecurrente` al inicio de cada mes. Implementado con `RecurrenteLog` (idempotente), trigger al arrancar el servidor, endpoint `POST /api/admin/generar-recurrentes` con botón en la UI de Gastos.~~

## [P3] Utilidad y Retención ✅ Completo

- [X] **Exportación de Datos**: Botón para descargar reportes en CSV o PDF para contabilidad personal fuera de la app.
- [X] **Búsqueda Global**: Buscador por descripción de gasto entre todos los meses disponibles.
- [X] **Filtros Avanzados**: Filtro por rango de montos (mínimo/máximo) en la lista de gastos.
- [X] **Notificaciones**: Avisos proactivos (Push o Email) cuando se registra un pago en un gasto compartido o cuando un presupuesto llega al 90%.

## [P4] Experiencia de Usuario y Pulido (Baja) ✅ Completo

- [X] **Micro-interacciones**: Agregar animaciones fluidas al abrir modales o al actualizar gráficos para esa sensación "premium".
- [X] **Aumento de Cobertura de Tests**: Extender la suite de tests unitarios y E2E para cubrir los flujos de "Gastos Compartidos" y "Reportes".

---

### Completadas recientemente:

- [X] **Metas de Ahorro (Avanzado)**: Sistema completo de ahorro con cálculos mensuales automáticos, barras de progreso y registro de aportes.
- [X] **Limpieza de Dashboard**: Lógica de reinicio mensual con banner de bienvenida y resumen comparativo del mes anterior.
- [X] **Diseño Responsive**: Sidebar colapsable, menú hamburguesa y contenedores de datos adaptables para una experiencia móvil fluida.
- [X] **Refactorización de Arquitectura**: Extracción de lógica compleja a custom hooks (`usePersistedData`, `useFormatting`) para mejorar la mantenibilidad.
- [X] **Grupos para Gastos Compartidos**: Soporte para múltiples grupos (Casa, Amigos, etc.) con aislamiento de datos.
- [X] **Micro-interacciones UI/UX**: Incorporación de animaciones con Framer Motion en componentes UI principales (Modales, Alertas).
- [X] **Cobertura de Tests API**: Agregadas pruebas de integración para los flujos de "Gastos Compartidos" y "Reportes".
- [X] **Despliegue Full-Stack (Vercel)**: API en producción funcionand. Resueltos: módulos ESM, variables de entorno y autenticación remota.
- [X] ~~**Modo Oscuro/Claro**: Selector de tema manual persistido y sincronizado con el backend.~~
- [X] ~~**Datos y reportes reales**: Tendencia mensual calculada desde API real, no datos hardcodeados.~~
- [X] ~~**Gestión de Cuentas**: Manejo de múltiples billeteras con saldos reales y sincronización automática.~~
- [X] ~~**Edición de Presupuestos**: Interfaz para ajustar montos y alertas de presupuestos existentes.~~
- [X] ~~**Gastos Compartidos**: Página dedicada con lógica de división de gastos entre participantes.~~

---

## [P5] Ideas Futuras

- [ ] **Categorías Personalizadas**: Permitir que el usuario cree y edite sus propias categorías con iconos y colores personalizados desde la UI.
- [ ] **IA de Análisis de Gastos**: Integración con un modelo de lenguaje para categorizar gastos automáticamente a partir de descripciones o fotos de tickets.
- [ ] **Modo Offline con PWA**: Service Workers para permitir el uso básico de la app sin conexión y sincronización posterior.
