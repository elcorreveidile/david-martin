import { useState, useEffect, useCallback } from "react";
import {
  fetchServices,
  fetchBusinessHours,
  fetchAvailability,
  createBooking,
} from "@/lib/api";
import type { Service, BusinessHour, BookingResponse } from "@/lib/api";
import ServicePicker from "@/components/ServicePicker";
import DatePicker from "@/components/DatePicker";
import SlotSelector from "@/components/SlotSelector";
import CustomerForm from "@/components/CustomerForm";
import type { CustomerData } from "@/components/CustomerForm";
import Confirmation from "@/components/Confirmation";
import ChatWidget from "@/components/ChatWidget";
import { Scissors, MapPin, Phone } from "lucide-react";

type Step = "service" | "date" | "slot" | "form" | "done";

const STEP_LABELS: Record<Step, string> = {
  service: "Servicio",
  date: "Fecha",
  slot: "Hora",
  form: "Datos",
  done: "Confirmación",
};

const STEPS: Step[] = ["service", "date", "slot", "form", "done"];

export default function App() {
  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);

  // Booking flow state
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    fetchServices().then(setServices).catch(console.error);
    fetchBusinessHours().then(setBusinessHours).catch(console.error);
  }, []);

  // Load availability when date changes
  const loadSlots = useCallback(
    async (serviceId: number, date: string) => {
      setSlotsLoading(true);
      setSlots([]);
      setSelectedSlot(null);
      try {
        const data = await fetchAvailability(serviceId, date);
        setSlots(data.slots.map((s) => s.start_time));
      } catch {
        setError("Error al consultar disponibilidad");
      } finally {
        setSlotsLoading(false);
      }
    },
    []
  );

  const handleServiceSelect = (s: Service) => {
    setSelectedService(s);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setStep("date");
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setStep("slot");
    if (selectedService) {
      loadSlots(selectedService.id, dateStr);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep("form");
  };

  const handleFormSubmit = async (data: CustomerData) => {
    if (!selectedService || !selectedSlot) return;
    setBookingLoading(true);
    setError(null);
    try {
      const result = await createBooking({
        customer_name: data.name,
        customer_email: data.email || null,
        customer_phone: data.phone || null,
        service_id: selectedService.id,
        start_time: selectedSlot,
        notes: data.notes || null,
      });
      setBooking(result);
      setStep("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear la reserva"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReset = () => {
    setStep("service");
    setSelectedService(null);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setBooking(null);
    setError(null);
  };

  const currentStepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
              <Scissors className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">
                David Martin
              </h1>
              <p className="text-xs text-zinc-400">Barber Shop &middot; Granada</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> 685 28 14 62
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Granada
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Progress bar */}
        {step !== "done" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.filter((s) => s !== "done").map((s, idx) => {
                const isActive = idx === currentStepIndex;
                const isDone = idx < currentStepIndex;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (isDone) setStep(s);
                    }}
                    disabled={!isDone}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "text-amber-400"
                        : isDone
                        ? "text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        : "text-zinc-600"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-amber-500 text-black"
                          : isDone
                          ? "bg-zinc-700 text-zinc-300"
                          : "bg-zinc-800 text-zinc-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="hidden sm:inline">
                      {STEP_LABELS[s]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / 4) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline hover:text-red-200"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Summary strip when past service step */}
        {step !== "service" && step !== "done" && selectedService && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm">
            <span className="text-amber-400 font-medium">
              {selectedService.name}
            </span>
            {selectedDate && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span className="text-zinc-300">{selectedDate}</span>
              </>
            )}
            {selectedSlot && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span className="text-zinc-300">
                  {new Date(selectedSlot).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
            <span className="ml-auto text-amber-400 font-bold">
              {selectedService.price_eur.toFixed(0)} &euro;
            </span>
          </div>
        )}

        {/* Steps */}
        {step === "service" && (
          <ServicePicker
            services={services}
            selected={selectedService}
            onSelect={handleServiceSelect}
          />
        )}
        {step === "date" && (
          <DatePicker
            businessHours={businessHours}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
          />
        )}
        {step === "slot" && (
          <SlotSelector
            slots={slots}
            selectedSlot={selectedSlot}
            onSelect={handleSlotSelect}
            loading={slotsLoading}
          />
        )}
        {step === "form" && (
          <CustomerForm onSubmit={handleFormSubmit} loading={bookingLoading} />
        )}
        {step === "done" && booking && selectedService && (
          <Confirmation
            booking={booking}
            service={selectedService}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 py-6 text-center text-xs text-zinc-500">
        <p>David Martin Barber Shop &middot; Granada</p>
        <p className="mt-1">
          <a
            href="https://davidmartinbarbershop.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500/70 hover:text-amber-400 transition-colors"
          >
            davidmartinbarbershop.es
          </a>
        </p>
      </footer>

      {/* Chat widget */}
      <ChatWidget />
    </div>
  );
}
