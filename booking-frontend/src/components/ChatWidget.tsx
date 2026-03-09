import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendChatMessage } from "@/lib/api";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "¡Hola! Soy el asistente virtual de David Martin Barber Shop. Pregunta por precios, disponibilidad o solicita una reserva.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);
    try {
      const response = await sendChatMessage(text);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Disculpa, ha ocurrido un error. Inténtalo de nuevo." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-black shadow-lg hover:bg-amber-600 transition-all"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex w-80 sm:w-96 flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
          style={{ height: "28rem" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-zinc-800 px-4 py-3 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-sm font-medium text-white">
                Asistente David Martin
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                  Escribiendo...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-700 p-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Escribe tu mensaje..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm"
            />
            <Button
              onClick={send}
              disabled={sending || !input.trim()}
              size="icon"
              className="bg-amber-500 hover:bg-amber-600 text-black flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
