from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from .chatbot import generate_response
from .database import SessionLocal, engine, get_session
from .models import Base, Booking, BusinessHour, Service
from .schemas import (
    AvailabilityResponse,
    Booking as BookingSchema,
    BookingCreate,
    ChatRequest,
    ChatResponse,
    Service as ServiceSchema,
)

app = FastAPI(title="David Martin Barber Shop Booking API")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with get_session() as session:
        if not session.query(Service).count():
            session.add_all(
                [
                    Service(
                        name="Corte clásico",
                        description="Corte de pelo tradicional con acabado profesional.",
                        duration_minutes=30,
                        price_eur=18.0,
                    ),
                    Service(
                        name="Degradado",
                        description="Fade completo y definición de contornos.",
                        duration_minutes=40,
                        price_eur=22.0,
                    ),
                    Service(
                        name="Arreglo de barba",
                        description="Perfilado y cuidado de barba con toalla caliente.",
                        duration_minutes=25,
                        price_eur=15.0,
                    ),
                    Service(
                        name="Pack corte + barba",
                        description="Servicio combinado de corte y barba.",
                        duration_minutes=60,
                        price_eur=32.0,
                    ),
                ]
            )

        if not session.query(BusinessHour).count():
            session.add_all(
                [
                    BusinessHour(weekday=0, open_time=time(10, 0), close_time=time(20, 0)),
                    BusinessHour(weekday=1, open_time=time(10, 0), close_time=time(20, 0)),
                    BusinessHour(weekday=2, open_time=time(10, 0), close_time=time(20, 0)),
                    BusinessHour(weekday=3, open_time=time(10, 0), close_time=time(20, 0)),
                    BusinessHour(weekday=4, open_time=time(10, 0), close_time=time(20, 0)),
                    BusinessHour(weekday=5, open_time=time(9, 0), close_time=time(14, 0)),
                ]
            )

        session.commit()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/services", response_model=List[ServiceSchema])
def list_services(db: Session = Depends(get_db)) -> List[Service]:
    return db.query(Service).order_by(Service.id).all()


@app.get("/availability", response_model=AvailabilityResponse)
def check_availability(
    service_id: int,
    target_date: date,
    db: Session = Depends(get_db),
) -> AvailabilityResponse:
    service = db.query(Service).get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    weekday = target_date.weekday()
    business_hour = db.query(BusinessHour).filter_by(weekday=weekday).first()
    if not business_hour:
        return AvailabilityResponse(
            service_id=service_id, date=target_date, available_slots=[]
        )

    start_datetime = datetime.combine(target_date, business_hour.open_time)
    end_datetime = datetime.combine(target_date, business_hour.close_time)
    slot_length = timedelta(minutes=service.duration_minutes)

    existing_bookings = (
        db.query(Booking)
        .filter(
            Booking.service_id == service_id,
            Booking.start_time >= start_datetime,
            Booking.start_time < end_datetime,
        )
        .all()
    )

    slots: List[datetime] = []
    current = start_datetime
    while current + slot_length <= end_datetime:
        current_end = current + slot_length
        overlaps = any(booking.overlaps(current, current_end) for booking in existing_bookings)
        if not overlaps:
            slots.append(current)
        current += timedelta(minutes=15)

    return AvailabilityResponse(
        service_id=service_id, date=target_date, available_slots=slots
    )


@app.post("/bookings", response_model=BookingSchema, status_code=201)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)) -> Booking:
    service = db.query(Service).get(booking.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    end_time = booking.start_time + timedelta(minutes=service.duration_minutes)

    overlapping = (
        db.query(Booking)
        .filter(
            Booking.service_id == booking.service_id,
            Booking.start_time < end_time,
            Booking.end_time > booking.start_time,
        )
        .first()
    )
    if overlapping:
        raise HTTPException(status_code=409, detail="El horario seleccionado no está disponible")

    new_booking = Booking(
        customer_name=booking.customer_name,
        customer_email=booking.customer_email,
        customer_phone=booking.customer_phone,
        service_id=booking.service_id,
        start_time=booking.start_time,
        end_time=end_time,
        status="confirmed",
        notes=booking.notes,
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@app.get("/bookings", response_model=List[BookingSchema])
def list_bookings(db: Session = Depends(get_db)) -> List[Booking]:
    return db.query(Booking).order_by(Booking.start_time).all()


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    reply = generate_response(request.message, db)
    return ChatResponse(response=reply)
