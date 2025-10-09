from __future__ import annotations

from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.database import get_session
from app.main import app, init_db
from app.models import Booking


def setup_module(module):
    init_db()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_bookings():
    with get_session() as session:
        session.query(Booking).delete()


def test_list_services(client):
    response = client.get("/services")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) and data
    service = data[0]
    assert {"id", "name", "price_eur", "duration_minutes"}.issubset(service.keys())


def test_create_and_list_booking(client):
    response = client.get("/services")
    service_id = response.json()[0]["id"]
    start_time = datetime.now().replace(hour=15, minute=0, second=0, microsecond=0) + timedelta(days=1)

    payload = {
        "customer_name": "Juan Pérez",
        "customer_email": "juan@example.com",
        "customer_phone": "+34 600 000 000",
        "service_id": service_id,
        "start_time": start_time.isoformat(),
        "notes": "Prefiere estilo clásico",
    }

    create_response = client.post("/bookings", json=payload)
    assert create_response.status_code == 201, create_response.text
    booking = create_response.json()
    assert booking["customer_name"] == "Juan Pérez"
    assert booking["end_time"] != booking["start_time"]

    list_response = client.get("/bookings")
    assert list_response.status_code == 200
    bookings = list_response.json()
    assert any(item["id"] == booking["id"] for item in bookings)


def test_prevent_overlapping_bookings(client):
    services_response = client.get("/services")
    service_id = services_response.json()[0]["id"]
    start_time = datetime.now().replace(hour=16, minute=0, second=0, microsecond=0) + timedelta(days=2)

    payload = {
        "customer_name": "Pedro",
        "customer_email": "pedro@example.com",
        "customer_phone": "600111222",
        "service_id": service_id,
        "start_time": start_time.isoformat(),
        "notes": None,
    }

    assert client.post("/bookings", json=payload).status_code == 201
    response = client.post("/bookings", json=payload)
    assert response.status_code == 409


def test_availability_endpoint(client):
    services_response = client.get("/services")
    service_id = services_response.json()[0]["id"]
    target_date = (date.today() + timedelta(days=3)).isoformat()

    response = client.get(
        "/availability", params={"service_id": service_id, "target_date": target_date}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["service_id"] == service_id
    assert isinstance(data["available_slots"], list)


def test_chat_price_intent(client):
    response = client.post("/chat", json={"message": "¿Cuánto cuesta un degradado?"})
    assert response.status_code == 200
    text = response.json()["response"].lower()
    assert "degradado" in text and "€" in text
