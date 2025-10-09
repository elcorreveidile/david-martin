# Plan Paso a Paso para Construir la Web de Reservas

Esta guía te acompaña, commit a commit, para transformar el núcleo de reservas existente en una experiencia web completa lista para desplegarse en https://davidmartinbarbershop.es/cortes-y-estilismo.

## 0. Punto de partida
- El repositorio ya contiene `app/main.py` con la clase `BookingSystem`, que gestiona servicios, horarios, disponibilidad y creación de citas sobre SQLite.
- `app/chatbot.py` expone `generate_response`, un bot basado en reglas que reutiliza los mismos datos para contestar preguntas frecuentes.
- Las pruebas (`pytest`) cubren la lógica de negocio principal. Úsalas como red de seguridad mientras avanzas.

## 1. Preparar el entorno de trabajo
1. Instala Python 3.11 y crea un virtualenv.
2. Ejecuta `pip install -r requirements.txt`.
3. Lanza `pytest` para asegurarte de que todo pasa antes de modificar código.
4. Crea ramas específicas (`feature/api-http`, `feature/widget`) para mantener el progreso organizado.

## 2. Exponer la lógica en una API HTTP
1. **Crear módulo FastAPI**
   - Añade un nuevo archivo `app/api.py` con una instancia de `FastAPI`.
   - Inyecta una instancia compartida de `BookingSystem` (por ejemplo, en `app/api.py` crea `booking_system = BookingSystem()`).
2. **Endpoints mínimos**
   - `GET /services`: devuelve `list_services()` serializados.
   - `GET /availability`: recibe `service_id` y `date`, llama a `check_availability` y responde con los slots disponibles.
   - `POST /bookings`: valida payload (nombre, contacto, servicio, fecha/hora) y llama a `create_booking`.
   - `POST /chat`: reenvía el mensaje a `booking_system.chat` para respuestas inmediatas en la web.
3. **Serialización**
   - Usa `pydantic` (incluido en FastAPI) o dataclasses `asdict` para convertir los modelos a JSON.
   - Normaliza las horas en formato ISO 8601 (`datetime.isoformat()`).
4. **Pruebas de API**
   - Crea `tests/test_http_api.py` con `TestClient` de FastAPI.
   - Cubre casos felices y errores (servicio inexistente, solapamientos de citas).
5. **Arranque local**
   - Añade a `README.md` instrucciones para lanzar el servidor: `uvicorn app.api:app --reload`.

## 3. Diseñar el widget de reservas (frontend)
1. **Bootstrapping**
   - Dentro de `frontend/` (nueva carpeta), ejecuta `npm create vite@latest booking-widget -- --template react` (o tu framework favorito).
   - Configura TailwindCSS o el sistema de estilos que utilice la web actual.
2. **Arquitectura del widget**
   - Componentes clave: `ServicePicker`, `DatePicker`, `SlotSelector`, `CustomerForm`, `BookingSummary`.
   - Define un contexto React (por ejemplo `BookingContext`) para compartir el estado de la reserva.
   - Crea hooks para consumir la API (`useServices`, `useAvailability`, `useCreateBooking`), apoyándote en `fetch` o `axios`.
3. **Integración con el chatbot**
   - Implementa un componente `ChatAssistant` que envíe preguntas al endpoint `POST /chat`.
   - Muestra respuestas en un panel lateral o ventana modal.
4. **Validaciones UX**
   - Bloquea días sin disponibilidad.
   - Añade feedback en tiempo real (spinners, mensajes de éxito/error).
5. **Build embebible**
   - Configura `vite.config.ts` para generar un bundle UMD (`build.rollupOptions.output.format = 'iife'`).
   - Expone un `window.DavidMartinBooking.init({ elementId, apiBaseUrl })` que monte el widget en cualquier página.

## 4. Insertar el widget en la web existente
1. Publica el bundle del widget en un CDN o subdominio (p.ej. `static.davidmartinbarbershop.es/widget.js`).
2. En la página de WordPress/Webflow actual, agrega el script:
   ```html
   <div id="dm-booking-widget"></div>
   <script src="https://static.davidmartinbarbershop.es/widget.js" defer></script>
   <script>
     window.addEventListener('DOMContentLoaded', () => {
       window.DavidMartinBooking.init({
         elementId: 'dm-booking-widget',
         apiBaseUrl: 'https://api.davidmartinbarbershop.es'
       });
     });
   </script>
   ```
3. Verifica estilos responsivos y accesibilidad (navegación con teclado, contrastes AA).

## 5. Automatizar confirmaciones y reseñas
1. Crea un módulo `app/notifications.py` con funciones stub para email/SMS/WhatsApp (puedes simular durante desarrollo con logs).
2. Desde `create_booking`, dispara una confirmación asincrónica (cola en memoria o Celery/RQ si añades Redis más adelante).
3. Añade en el frontend una pantalla de éxito con botón "Dejar reseña" que abra `https://search.google.com/local/writereview?placeid=...`.

## 6. Preparar despliegues
1. Escribe `Dockerfile` y `docker-compose.yml` que empaqueten API + SQLite (montando volumen persistente).
2. Configura CI/CD (GitHub Actions) para ejecutar `pytest`, `npm test` y construir imágenes.
3. Define un pipeline de despliegue (p.ej. Railway/Render para la API, Netlify/Vercel/Cloudflare Pages para el widget).

## 7. Siguientes iteraciones
- Sustituir SQLite por PostgreSQL cuando el tráfico aumente.
- Conectar proveedores reales de notificaciones.
- Medir conversión con Google Analytics/Tag Manager y heatmaps.
- Documentar el flujo conversacional para la Fase 2 (WhatsApp/Llamadas) reusando la misma base de datos.

---
**Consejo**: Cada vez que completes una sección, crea un pull request pequeño (API, widget, integración) para facilitar las revisiones y retroalimentación.
