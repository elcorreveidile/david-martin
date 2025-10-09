# Guía de Implementación Paso a Paso

Esta guía concreta cómo comenzar la construcción del sistema integral de reservas inteligentes descrito en la arquitectura del proyecto, detallando fases, hitos técnicos y responsables sugeridos. También evalúa la alternativa de llevar la solución a una aplicación nativa.

## 1. Preparación del Entorno (Semana 0)
1. **Definir equipo y responsables**
   - *Product Owner*: valida requisitos y prioriza funcionalidades.
   - *Tech Lead / Arquitecto*: toma decisiones técnicas finales.
   - *Backend Developer(s)*, *Frontend Developer(s)*, *Conversational Designer*, *DevOps*.
2. **Infraestructura inicial**
   - Crear repositorio Git privado y configurar integración continua (GitHub Actions o GitLab CI).
   - Aprovisionar entornos: `dev`, `staging`, `production` con Docker Compose local y Docker en la nube (ECS/Fargate o DigitalOcean).
   - Configurar gestor de secretos (AWS Secrets Manager, Doppler o Vault).
3. **Datos iniciales**
   - Recopilar lista de servicios, duración, precios, profesionales y horarios reales.
   - Definir políticas de cancelación, límites de overbooking y buffers entre citas.

## 2. Fase 1 – Backend y API de Reservas (Semanas 1-4)
1. **Modelado y migraciones**
   - Implementar esquemas en PostgreSQL con migraciones (Alembic si se usa FastAPI / SQLAlchemy; Prisma si NestJS).
   - Tablas: `services`, `staff`, `business_hours`, `time_slots`, `bookings`, `customers`, `reviews`, `audit_logs`.
2. **Servicios clave**
   - API REST/GraphQL con endpoints definidos en `docs/architecture.md`.
   - Motor de disponibilidad que calcule huecos libres combinando duración, buffers y citas existentes.
   - Servicio de notificaciones con plantillas (correo y SMS) y webhooks para WhatsApp en la fase 2.
3. **Pruebas automatizadas**
   - Unit tests para lógica de disponibilidad y creación de citas.
   - Contract tests para endpoints (usando pytest + httpx o Jest + supertest).
   - Configurar CI para ejecutar pruebas y linting en cada push.
4. **Documentación**
   - Generar especificación OpenAPI y publicarla en Swagger UI.
   - Crear manual para onboarding de nuevos desarrolladores (setup, variables de entorno, scripts).

## 3. Fase 1 – Frontend Web y Chatbot (Semanas 5-7)
1. **Widget de reservas**
   - Tecnología sugerida: React + Tailwind dentro de un paquete embebible (microfrontend o iframe).
   - Componentes mínimos: selector de servicio, calendario, formulario de cliente, resumen de cita.
   - Integración con API: usar React Query/SWR para sincronizar disponibilidad en tiempo real.
2. **Integración con la web existente**
   - Incluir el widget en https://davidmartinbarbershop.es/cortes-y-estilismo mediante script `<script src="/widget.js"></script>` o iframe alojado en subdominio.
   - Asegurar estilo coherente con la marca y compatibilidad responsive.
3. **Chatbot IA**
   - Configurar proveedor (OpenAI Assistants / Azure OpenAI).
   - Diseñar prompts y funciones para acceder a la API de reservas.
   - Prototipar flujos conversacionales en herramientas como Voiceflow o Botpress y exportar intents al motor elegido.
4. **Botón de reseñas**
   - Obtener enlace directo de reseñas de Google My Business (`https://search.google.com/local/writereview?...`).
   - Añadir botón destacado junto al mapa dentro del widget o en el sitio.
5. **QA y lanzamiento de fase 1**
   - Pruebas manuales cross-browser (Chrome, Safari, Edge, móviles).
   - Test de carga básico (k6, Artillery) para validar concurrencia.
   - Checklist de accesibilidad (WCAG AA) y RGPD (consentimientos).

## 4. Fase 2 – Omnicanal (Semanas 8-12)
1. **WhatsApp Business API**
   - Registrar número y aprobar plantillas (HSM) con Meta.
   - Implementar webhook para mensajes entrantes y worker que se conecte a la misma lógica de reservas.
2. **Llamadas automatizadas**
   - Twilio Programmable Voice + Studio para orquestar llamadas.
   - Speech-to-Text (Google STT) y Text-to-Speech (Amazon Polly) integrados mediante funciones Lambda o servicios equivalentes.
   - Script conversacional con confirmaciones y fallback a humano.
3. **Sincronización y orquestación**
   - Middleware que unifique contexto de conversación (ID de cliente, última intención) en Redis o base NoSQL.
   - Jobs de recordatorio: enviar WhatsApp/llamada 24h antes de la cita y confirmación el mismo día.
4. **Pruebas de campo**
   - Ejecutar pilotos internos y con clientes fieles.
   - Ajustar NLU (intents/entidades) según feedback.

## 5. Mantenimiento y Evolución
- Monitoreo con Sentry + Grafana/Prometheus.
- Políticas de backup diarios de la base de datos y rotación de logs.
- Roadmap futuro: programa de fidelización, pagos online, app móvil.

## 6. ¿Y una App Nativa?
| Aspecto | Web + Chatbot | App Nativa |
|---------|----------------|------------|
| **Tiempo de lanzamiento** | 2-3 meses (fase 1 lista para producción). | +3 meses adicionales por desarrollo iOS/Android y publicación en stores. |
| **Coste** | Menor, se reutiliza frontend web y API existentes. | Mayor: desarrollo doble (iOS/Android), mantenimiento de stores, soporte continuo. |
| **Adopción de usuarios** | Inmediata, sin instalación; ideal para clientes ocasionales. | Requiere descargar app, útil para clientes muy recurrentes. |
| **Notificaciones** | Email/SMS/WhatsApp ya cubren recordatorios. | Push notifications nativas dan mayor alcance, pero requieren permisos. |
| **Mantenimiento** | Una sola base de código web. | Actualizaciones frecuentes por cambios de SO y stores. |

**Recomendación**: Priorizar la experiencia web + chatbot omnicanal. Considerar app nativa solo si:
- Más del 60% de los clientes reserva mensualmente y demanda funcionalidades adicionales (pagos, historial, programas de fidelización avanzados).
- Se dispone de presupuesto anual para mantenimiento y marketing en tiendas.

## 7. Próximos Pasos Inmediatos
1. Validar esta guía con el equipo y acordar calendario.
2. Estimar presupuesto y asignar responsables para cada subproyecto.
3. Iniciar Sprint 0 con setup del repositorio, CI/CD y aprovisionamiento de entornos.
4. Crear backlog detallado en Jira/Trello con historias por componente.

---
**Contacto recomendado**: involucrar a un partner especializado en IA conversacional y reservas si el equipo interno no tiene experiencia previa.
