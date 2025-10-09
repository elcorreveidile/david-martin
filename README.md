# David Martin Barber Shop – Sistema de Reservas Inteligentes

Este repositorio contiene la documentación técnica inicial y una primera implementación funcional para el sistema integral de reservas inteligentes, chatbot IA y automatización multicanal para David Martin Barber Shop.

## API de reservas y chatbot

La carpeta `app/` incluye una API desarrollada con **FastAPI** y SQLite que permite:

- Consultar servicios disponibles (`GET /services`).
- Ver huecos libres por servicio y fecha (`GET /availability`).
- Crear nuevas reservas con validación de solapes (`POST /bookings`).
- Obtener el histórico de reservas (`GET /bookings`).
- Interactuar con un chatbot básico entrenado con reglas sobre precios, horarios y reseñas (`POST /chat`).

### Requisitos

Instala las dependencias con:

```bash
pip install -r requirements.txt
```

### Ejecutar la API localmente

```bash
uvicorn app.main:app --reload
```

La documentación interactiva estará disponible en `http://127.0.0.1:8000/docs`.

### Ejecutar las pruebas

```bash
pytest
```

## Documentación
- [Plan de Arquitectura](docs/architecture.md)

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

