from __future__ import annotations

from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import List, Optional

from .chatbot import generate_response
from .database import get_connection, set_db_path
from .models import Booking, BusinessHour, Service

SERVICE_SEED = [
    ("Corte clásico", "Corte de pelo tradicional con acabado profesional.", 30, 18.0),
    ("Degradado", "Fade completo y definición de contornos.", 40, 22.0),
    ("Arreglo de barba", "Perfilado y cuidado de barba con toalla caliente.", 25, 15.0),
    ("Pack corte + barba", "Servicio combinado de corte y barba.", 60, 32.0),
]

BUSINESS_HOUR_SEED = [
    (0, time(10, 0), time(20, 0)),
    (1, time(10, 0), time(20, 0)),
    (2, time(10, 0), time(20, 0)),
    (3, time(10, 0), time(20, 0)),
    (4, time(10, 0), time(20, 0)),
    (5, time(9, 0), time(14, 0)),
]


class BookingSystem:
    """Core business logic for the barber shop booking workflow."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        if db_path is not None:
            set_db_path(db_path)
        self._initialize()

    def _initialize(self) -> None:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    duration_minutes INTEGER NOT NULL,
                    price_eur REAL NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS business_hours (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    weekday INTEGER NOT NULL,
                    open_time TEXT NOT NULL,
                    close_time TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_name TEXT NOT NULL,
                    customer_email TEXT,
                    customer_phone TEXT,
                    service_id INTEGER NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    status TEXT NOT NULL,
                    notes TEXT,
                    FOREIGN KEY(service_id) REFERENCES services(id)
                )
                """
            )

            cursor.execute("SELECT COUNT(*) FROM services")
            if cursor.fetchone()[0] == 0:
                cursor.executemany(
                    "INSERT INTO services (name, description, duration_minutes, price_eur) VALUES (?, ?, ?, ?)",
                    SERVICE_SEED,
                )

            cursor.execute("SELECT COUNT(*) FROM business_hours")
            if cursor.fetchone()[0] == 0:
                cursor.executemany(
                    "INSERT INTO business_hours (weekday, open_time, close_time) VALUES (?, ?, ?)",
                    [
                        (
                            weekday,
                            open.strftime("%H:%M"),
                            close.strftime("%H:%M"),
                        )
                        for weekday, open, close in BUSINESS_HOUR_SEED
                    ],
                )

    # ------------------------------------------------------------------
    # Helpers to hydrate dataclasses
    # ------------------------------------------------------------------
    def _row_to_service(self, row) -> Service:
        return Service(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            duration_minutes=row["duration_minutes"],
            price_eur=row["price_eur"],
        )

    def _row_to_business_hour(self, row) -> BusinessHour:
        open_time = datetime.strptime(row["open_time"], "%H:%M").time()
        close_time = datetime.strptime(row["close_time"], "%H:%M").time()
        return BusinessHour(
            id=row["id"],
            weekday=row["weekday"],
            open_time=open_time,
            close_time=close_time,
        )

    def _row_to_booking(self, row) -> Booking:
        return Booking(
            id=row["id"],
            customer_name=row["customer_name"],
            customer_email=row["customer_email"],
            customer_phone=row["customer_phone"],
            service_id=row["service_id"],
            start_time=datetime.fromisoformat(row["start_time"]),
            end_time=datetime.fromisoformat(row["end_time"]),
            status=row["status"],
            notes=row["notes"],
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def list_services(self) -> List[Service]:
        with get_connection() as conn:
            cursor = conn.execute("SELECT * FROM services ORDER BY id")
            return [self._row_to_service(row) for row in cursor.fetchall()]

    def list_business_hours(self) -> List[BusinessHour]:
        with get_connection() as conn:
            cursor = conn.execute("SELECT * FROM business_hours ORDER BY weekday")
            return [self._row_to_business_hour(row) for row in cursor.fetchall()]

    def _get_service(self, service_id: int) -> Optional[Service]:
        with get_connection() as conn:
            cursor = conn.execute("SELECT * FROM services WHERE id = ?", (service_id,))
            row = cursor.fetchone()
            return self._row_to_service(row) if row else None

    def check_availability(self, service_id: int, target_date: date) -> List[datetime]:
        service = self._get_service(service_id)
        if service is None:
            raise ValueError("Servicio no encontrado")

        weekday = target_date.weekday()
        with get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM business_hours WHERE weekday = ?", (weekday,)
            )
            row = cursor.fetchone()
            if row is None:
                return []
            business_hour = self._row_to_business_hour(row)

            start_datetime = datetime.combine(target_date, business_hour.open_time)
            end_datetime = datetime.combine(target_date, business_hour.close_time)
            slot_length = timedelta(minutes=service.duration_minutes)

            bookings = [
                self._row_to_booking(r)
                for r in conn.execute(
                    """
                    SELECT * FROM bookings
                    WHERE service_id = ? AND start_time >= ? AND start_time < ?
                    ORDER BY start_time
                    """,
                    (
                        service_id,
                        start_datetime.isoformat(),
                        end_datetime.isoformat(),
                    ),
                ).fetchall()
            ]

        slots: List[datetime] = []
        current = start_datetime
        while current + slot_length <= end_datetime:
            current_end = current + slot_length
            overlaps = any(booking.overlaps(current, current_end) for booking in bookings)
            if not overlaps:
                slots.append(current)
            current += timedelta(minutes=15)
        return slots

    def create_booking(
        self,
        *,
        customer_name: str,
        customer_email: Optional[str],
        customer_phone: Optional[str],
        service_id: int,
        start_time: datetime,
        notes: Optional[str] = None,
    ) -> Booking:
        service = self._get_service(service_id)
        if service is None:
            raise ValueError("Servicio no encontrado")

        end_time = start_time + timedelta(minutes=service.duration_minutes)
        normalized_phone = self._normalize_phone(customer_phone)

        with get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT * FROM bookings
                WHERE service_id = ?
                  AND start_time < ?
                  AND end_time > ?
                LIMIT 1
                """,
                (
                    service_id,
                    end_time.isoformat(),
                    start_time.isoformat(),
                ),
            )
            if cursor.fetchone():
                raise ValueError("El horario seleccionado no está disponible")

            cursor = conn.execute(
                """
                INSERT INTO bookings (
                    customer_name, customer_email, customer_phone, service_id,
                    start_time, end_time, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    customer_name,
                    customer_email,
                    normalized_phone,
                    service_id,
                    start_time.isoformat(),
                    end_time.isoformat(),
                    "confirmed",
                    notes,
                ),
            )
            booking_id = cursor.lastrowid
            conn.commit()

            cursor = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
            row = cursor.fetchone()
            return self._row_to_booking(row)

    def list_bookings(self) -> List[Booking]:
        with get_connection() as conn:
            cursor = conn.execute("SELECT * FROM bookings ORDER BY start_time")
            return [self._row_to_booking(row) for row in cursor.fetchall()]

    def chat(self, message: str) -> str:
        services = self.list_services()
        hours = self.list_business_hours()
        return generate_response(message, services, hours)

    def clear_bookings(self) -> None:
        with get_connection() as conn:
            conn.execute("DELETE FROM bookings")

    @staticmethod
    def _normalize_phone(phone: Optional[str]) -> Optional[str]:
        if phone is None:
            return None
        digits = "".join(ch for ch in phone if ch.isdigit())
        return digits or phone
