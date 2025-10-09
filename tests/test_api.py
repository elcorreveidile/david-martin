from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path
import sys

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import database
from app.main import BookingSystem


@pytest.fixture()
def system(tmp_path):
    db_path = tmp_path / "reservations.db"
    database.set_db_path(db_path)
    system = BookingSystem(db_path=db_path)
    system.clear_bookings()
    return system


def test_list_services(system):
    services = system.list_services()
    assert services, "Debe haber servicios iniciales precargados"
    first = services[0]
    assert first.id > 0
    assert first.name
    assert first.price_eur > 0


def test_create_and_list_booking(system):
    service_id = system.list_services()[0].id
    start_time = (
        datetime.now().replace(hour=15, minute=0, second=0, microsecond=0)
        + timedelta(days=1)
    )

    booking = system.create_booking(
        customer_name="Juan Pérez",
        customer_email="juan@example.com",
        customer_phone="+34 600 000 000",
        service_id=service_id,
        start_time=start_time,
        notes="Prefiere estilo clásico",
    )

    assert booking.customer_name == "Juan Pérez"
    assert booking.end_time > booking.start_time
    assert booking.customer_phone == "34600000000"

    bookings = system.list_bookings()
    assert any(item.id == booking.id for item in bookings)


def test_prevent_overlapping_bookings(system):
    service_id = system.list_services()[0].id
    start_time = (
        datetime.now().replace(hour=16, minute=0, second=0, microsecond=0)
        + timedelta(days=2)
    )

    system.create_booking(
        customer_name="Pedro",
        customer_email="pedro@example.com",
        customer_phone="600111222",
        service_id=service_id,
        start_time=start_time,
        notes=None,
    )

    with pytest.raises(ValueError):
        system.create_booking(
            customer_name="Pedro",
            customer_email="pedro@example.com",
            customer_phone="600111222",
            service_id=service_id,
            start_time=start_time,
            notes=None,
        )


def test_availability(system):
    service_id = system.list_services()[0].id
    target_date = date.today() + timedelta(days=3)

    slots = system.check_availability(service_id=service_id, target_date=target_date)
    assert isinstance(slots, list)
    assert all(slot.date() == target_date for slot in slots)


def test_chat_price_intent(system):
    response = system.chat("¿Cuánto cuesta un degradado?")
    assert "degradado" in response.lower()
    assert "€" in response
