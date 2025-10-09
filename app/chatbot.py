from __future__ import annotations

from typing import Iterable

from sqlalchemy.orm import Session

from .models import BusinessHour, Service

DAY_NAMES = {
    0: "lunes",
    1: "martes",
    2: "miércoles",
    3: "jueves",
    4: "viernes",
    5: "sábado",
    6: "domingo",
}


def format_services(services: Iterable[Service]) -> str:
    lines = [
        f"- {service.name} ({service.duration_minutes} min): {service.price_eur:.2f} €"
        for service in services
    ]
    return "\n".join(lines)


def format_schedule(hours: Iterable[BusinessHour]) -> str:
    day_map = {hour.weekday: hour for hour in hours}
    lines = []
    for weekday in range(7):
        if weekday in day_map:
            hour = day_map[weekday]
            lines.append(
                f"{DAY_NAMES[weekday].title()}: {hour.open_time.strftime('%H:%M')} - {hour.close_time.strftime('%H:%M')}"
            )
        else:
            lines.append(f"{DAY_NAMES[weekday].title()}: cerrado")
    return "\n".join(lines)


def generate_response(message: str, session: Session) -> str:
    normalized = message.lower()
    services = session.query(Service).order_by(Service.id).all()

    if any(keyword in normalized for keyword in ("precio", "cuánto", "coste")):
        service_lines = format_services(services)
        return (
            "Estos son nuestros servicios y precios actuales:\n"
            f"{service_lines}\n\nPuedes reservar directamente indicando día y hora."
        )

    if any(keyword in normalized for keyword in ("horario", "hora abren", "abiertos", "abrís")):
        hours = session.query(BusinessHour).all()
        schedule = format_schedule(hours)
        return (
            "Nuestro horario semanal es:\n"
            f"{schedule}\n\nPuedes consultarme disponibilidad para un día concreto."
        )

    if any(keyword in normalized for keyword in ("reservar", "cita", "agenda")):
        return (
            "Puedo ayudarte con tu cita. Indícame el servicio, el día y la hora que prefieres"
            " y comprobaré la disponibilidad."
        )

    if any(keyword in normalized for keyword in ("disponible", "libre", "disponibilidad")):
        return (
            "Para comprobar la disponibilidad necesito saber el servicio y la fecha."
            " Puedes usar el endpoint /availability o decirme, por ejemplo,"
            " '¿Tienes hueco para un degradado el viernes a las 17:00?'."
        )

    if any(keyword in normalized for keyword in ("hola", "buenas", "qué tal")):
        return (
            "¡Hola! Soy el asistente virtual de David Martin Barber Shop."
            " Pregunta por precios, disponibilidad o solicita una reserva."
        )

    if "gracias" in normalized:
        return "¡Gracias a ti! Si necesitas otra cosa, aquí estoy."

    if "reseña" in normalized or "opinión" in normalized:
        return (
            "Puedes dejar una reseña en Google desde el mapa de nuestra web"
            " usando el botón 'Escribir una reseña'."
        )

    return (
        "No estoy seguro de haber entendido tu consulta."
        " Pregunta por precios, horarios o dime cuándo quieres reservar."
    )
