"""FastAPI HTTP layer wrapping the existing BookingSystem."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .main import BookingSystem

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ServiceOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    duration_minutes: int
    price_eur: float


class SlotOut(BaseModel):
    start_time: str


class AvailabilityOut(BaseModel):
    service_id: int
    date: str
    slots: List[SlotOut]


class BookingRequest(BaseModel):
    customer_name: str = Field(..., min_length=1)
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    service_id: int
    start_time: str = Field(..., description="ISO 8601 datetime, e.g. 2025-03-15T10:00:00")
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    customer_name: str
    customer_email: Optional[str]
    customer_phone: Optional[str]
    service_id: int
    start_time: str
    end_time: str
    status: str
    notes: Optional[str]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    response: str


class BusinessHourOut(BaseModel):
    weekday: int
    open_time: str
    close_time: str


# ---------------------------------------------------------------------------
# App & shared instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="David Martin Barber Shop – API de Reservas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

booking_system = BookingSystem()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/services", response_model=List[ServiceOut])
def get_services():
    """Return the catalogue of available services."""
    services = booking_system.list_services()
    return [
        ServiceOut(
            id=s.id,
            name=s.name,
            description=s.description,
            duration_minutes=s.duration_minutes,
            price_eur=s.price_eur,
        )
        for s in services
    ]


@app.get("/business-hours", response_model=List[BusinessHourOut])
def get_business_hours():
    """Return the weekly schedule."""
    hours = booking_system.list_business_hours()
    return [
        BusinessHourOut(
            weekday=h.weekday,
            open_time=h.open_time.strftime("%H:%M"),
            close_time=h.close_time.strftime("%H:%M"),
        )
        for h in hours
    ]


@app.get("/availability", response_model=AvailabilityOut)
def get_availability(
    service_id: int = Query(..., description="ID del servicio"),
    date_str: str = Query(..., alias="date", description="Fecha en formato YYYY-MM-DD"),
):
    """Return available time slots for a service on a given date."""
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usa YYYY-MM-DD.")

    try:
        slots = booking_system.check_availability(service_id, target_date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return AvailabilityOut(
        service_id=service_id,
        date=date_str,
        slots=[SlotOut(start_time=slot.isoformat()) for slot in slots],
    )


@app.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking(payload: BookingRequest):
    """Create a new booking."""
    try:
        start_dt = datetime.fromisoformat(payload.start_time)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha/hora inválido.")

    try:
        booking = booking_system.create_booking(
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone,
            service_id=payload.service_id,
            start_time=start_dt,
            notes=payload.notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return BookingOut(
        id=booking.id,
        customer_name=booking.customer_name,
        customer_email=booking.customer_email,
        customer_phone=booking.customer_phone,
        service_id=booking.service_id,
        start_time=booking.start_time.isoformat(),
        end_time=booking.end_time.isoformat(),
        status=booking.status,
        notes=booking.notes,
    )


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    """Send a message to the rule-based chatbot."""
    response = booking_system.chat(payload.message)
    return ChatResponse(response=response)
