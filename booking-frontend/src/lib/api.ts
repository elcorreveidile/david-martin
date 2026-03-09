const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_eur: number;
}

export interface Slot {
  start_time: string;
}

export interface AvailabilityResponse {
  service_id: number;
  date: string;
  slots: Slot[];
}

export interface BookingRequest {
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_id: number;
  start_time: string;
  notes: string | null;
}

export interface BookingResponse {
  id: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

export interface BusinessHour {
  weekday: number;
  open_time: string;
  close_time: string;
}

export interface ChatResponse {
  response: string;
}

export async function fetchServices(): Promise<Service[]> {
  const res = await fetch(`${API_URL}/services`);
  if (!res.ok) throw new Error("Error al cargar los servicios");
  return res.json();
}

export async function fetchBusinessHours(): Promise<BusinessHour[]> {
  const res = await fetch(`${API_URL}/business-hours`);
  if (!res.ok) throw new Error("Error al cargar horarios");
  return res.json();
}

export async function fetchAvailability(
  serviceId: number,
  date: string
): Promise<AvailabilityResponse> {
  const res = await fetch(
    `${API_URL}/availability?service_id=${serviceId}&date=${date}`
  );
  if (!res.ok) throw new Error("Error al consultar disponibilidad");
  return res.json();
}

export async function createBooking(
  booking: BookingRequest
): Promise<BookingResponse> {
  const res = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail || "Error al crear la reserva");
  }
  return res.json();
}

export async function sendChatMessage(message: string): Promise<string> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Error al enviar mensaje");
  const data: ChatResponse = await res.json();
  return data.response;
}
