# David Martin Barber Shop – Sistema de Reservas Inteligentes

Este repositorio contiene la documentación técnica inicial y una primera implementación funcional para el sistema integral de reservas inteligentes, chatbot IA y automatización multicanal para David Martin Barber Shop.

## Núcleo de reservas y chatbot

La carpeta `app/` contiene la lógica de negocio del planificador implementada en Python puro y SQLite (sin dependencias externas). El objeto `BookingSystem` expone métodos sencillos para:

- Consultar los servicios y tarifas configurados.
- Calcular huecos libres por servicio y fecha con pasos de 15 minutos.
- Crear reservas nuevas evitando solapes.
- Recuperar reservas existentes para integrarlas con otros canales.
- Obtener respuestas automáticas del chatbot basado en reglas y datos reales del negocio.

Esta base te permite empezar a programar desde el primer momento: puedes conectar la clase `BookingSystem` a una API, a un bot de WhatsApp o a una interfaz web según avances en el proyecto.

### Cómo probar el proyecto paso a paso

1. **Crear un entorno virtual (opcional, pero recomendado)**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # En Windows usa .venv\Scripts\activate
   ```

2. **Instalar las dependencias mínimas**

   ```bash
   pip install -r requirements.txt
   ```

3. **Ejecutar la batería de pruebas automatizadas**

   ```bash
   pytest
   ```

   Las pruebas crean una base de datos SQLite temporal, verifican que los servicios iniciales estén disponibles y que el motor de reservas evite solapes.

4. **Probar la lógica manualmente desde consola**

   ```python
   from datetime import datetime, timedelta

   from app.main import BookingSystem

   system = BookingSystem()
   service = system.list_services()[0]
   start = datetime.now().replace(hour=17, minute=0, second=0, microsecond=0) + timedelta(days=1)
   booking = system.create_booking(
       customer_name="Cliente demo",
       customer_email="demo@example.com",
       customer_phone="600123123",
       service_id=service.id,
       start_time=start,
   )
   print(booking)
   print(system.chat("¿Cuánto cuesta un degradado?"))
   ```

   Con este fragmento puedes verificar cómo responde el sistema y revisar la base `reservations.db` que se genera en el directorio de trabajo.

### Ejemplo rápido en consola

```python
from datetime import datetime, timedelta

from app.main import BookingSystem

system = BookingSystem()
service = system.list_services()[0]
start = datetime.now().replace(hour=17, minute=0, second=0, microsecond=0) + timedelta(days=1)
booking = system.create_booking(
    customer_name="Cliente demo",
    customer_email="demo@example.com",
    customer_phone="600123123",
    service_id=service.id,
    start_time=start,
)
print(booking)
print(system.chat("¿Cuánto cuesta un degradado?"))
```

## Documentación
- [Plan de Arquitectura](docs/architecture.md)
- [Paso a paso para construir la web de reservas](docs/web_build_steps.md)

### Integración de reseñas en Google Maps

Para permitir reseñas directas desde el mapa incrustado en la web existente, añade un botón junto al widget de Google Maps con el siguiente enlace, sustituyendo `PLACE_ID` por el identificador del negocio:

```html
<a class="btn btn-primary" target="_blank" rel="noopener" href="https://search.google.com/local/writereview?placeid=PLACE_ID">
  Escribir una reseña en Google
</a>
```

## Próximos pasos
1. Validar el plan con los stakeholders.
2. Priorizar la fase 1 (reservas + chatbot web) antes de abordar la fase 2 (WhatsApp/voz).
3. Establecer el stack tecnológico definitivo y comenzar el desarrollo iterativo.
4. Integrar la API con el front existente y preparar la fase 2 (WhatsApp / voz) aprovechando la misma base de datos de reservas.

