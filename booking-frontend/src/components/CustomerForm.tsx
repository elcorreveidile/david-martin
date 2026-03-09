import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, FileText, ArrowRight } from "lucide-react";

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface Props {
  onSubmit: (data: CustomerData) => void;
  loading: boolean;
}

export default function CustomerForm({ onSubmit, loading }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!phone.trim()) e.phone = "El teléfono es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim() });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white mb-4">Tus datos</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-300 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Nombre *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20"
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-zinc-300 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Teléfono *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="600 123 456"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20"
          />
          {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-300 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email (opcional)
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-zinc-300 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Notas (opcional)
          </Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferencias, estilo deseado..."
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 rounded-xl transition-all"
        >
          {loading ? (
            "Reservando..."
          ) : (
            <>
              Confirmar reserva
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
