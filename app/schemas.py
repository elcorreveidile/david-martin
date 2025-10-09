from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, validator


class ServiceBase(BaseModel):
    name: str
    description: Optional[str]
    duration_minutes: int = Field(gt=0)
    price_eur: float = Field(gt=0)


class Service(ServiceBase):
    id: int

    class Config:
        orm_mode = True


class BookingBase(BaseModel):
    customer_name: str
    customer_email: Optional[EmailStr]
    customer_phone: Optional[str]
    service_id: int
    start_time: datetime
    notes: Optional[str]

    @validator("customer_phone")
    def normalize_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        digits = "".join(filter(str.isdigit, value))
        return digits or value


class BookingCreate(BookingBase):
    pass


class Booking(BookingBase):
    id: int
    end_time: datetime
    status: str

    class Config:
        orm_mode = True


class AvailabilityResponse(BaseModel):
    service_id: int
    date: date
    available_slots: List[datetime]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
