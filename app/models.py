from __future__ import annotations

from datetime import datetime, time

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    price_eur = Column(Float, nullable=False)

    bookings = relationship("Booking", back_populates="service")


class BusinessHour(Base):
    __tablename__ = "business_hours"

    id = Column(Integer, primary_key=True, index=True)
    weekday = Column(Integer, nullable=False)  # Monday=0, Sunday=6
    open_time = Column(Time, nullable=False)
    close_time = Column(Time, nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="confirmed")
    notes = Column(String, nullable=True)

    service = relationship("Service", back_populates="bookings")

    def overlaps(self, start: datetime, end: datetime) -> bool:
        return max(self.start_time, start) < min(self.end_time, end)
