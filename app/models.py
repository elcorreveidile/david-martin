from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time
from typing import Optional


@dataclass
class Service:
    id: int
    name: str
    description: Optional[str]
    duration_minutes: int
    price_eur: float


@dataclass
class BusinessHour:
    id: int
    weekday: int
    open_time: time
    close_time: time


@dataclass
class Booking:
    id: int
    customer_name: str
    customer_email: Optional[str]
    customer_phone: Optional[str]
    service_id: int
    start_time: datetime
    end_time: datetime
    status: str
    notes: Optional[str]

    def overlaps(self, start: datetime, end: datetime) -> bool:
        return max(self.start_time, start) < min(self.end_time, end)
