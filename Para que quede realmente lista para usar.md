# Hoja de Ruta: Hacia una App de Producción

He reorganizado la lista por **Prioridad (P1 a P4)** para que tengas una guía clara de qué pasos dar para que la app sea realmente profesional y escalable.

## [P1] Estabilidad e Infraestructura (Crítico)

- [X] **Operación y Despliegue**: Dockerización de la app, variables por entorno (dev/prod), logs estructurados y estrategia de backups de MongoDB.
- [X] **Sincronización de Preferencias**: Persistir locale, moneda y tema en el backend por usuario para que la experiencia sea consistente en todos los dispositivos.

## [P2] Automatización y Gestión Avanzada (Alta)

- [ ] **Automatización de Recurrentes**: Implementar un proceso en el backend (cron job) que genere automáticamente los gastos marcados como `esRecurrente` al inicio de cada mes.

## [P3] Utilidad y Retención (Media)

- [ ] **Exportación de Datos**: Botón para descargar reportes en CSV o PDF para contabilidad personal fuera de la app.
- [ ] **Búsqueda y Filtros Avanzados**: Buscador por descripción y filtros por rango de montos en la lista de gastos.
- [ ] **Notificaciones**: Avisos proactivos (Push o Email) cuando se registra un pago en un gasto compartido o cuando un presupuesto llega al 90%.

## [P4] Experiencia de Usuario y Pulido (Baja)

- [ ] **Modo Oscuro/Claro**: Selector de tema manual (actualmente depende del sistema/got vibes).
- [ ] **Micro-interacciones**: Agregar animaciones fluidas al abrir modales o al actualizar gráficos para esa sensación "premium".
- [ ] **Aumento de Cobertura de Tests**: Extender la suite de tests unitarios y E2E para cubrir los flujos de "Gastos Compartidos" y "Reportes".

---

### Completadas recientemente:

- [X] ~~**Datos y reportes reales**: Quitar datos hardcodeados de tendencia mensual y calcularlos desde datos reales.~~
- [X] ~~**Gestión de Cuentas**: Manejo de múltiples billeteras con saldos reales y sincronización automática.~~
- [X] ~~**Edición de Presupuestos**: Interfaz para ajustar montos y alertas de presupuestos existentes.~~
