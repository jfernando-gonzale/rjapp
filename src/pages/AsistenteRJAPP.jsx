import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Bot, RotateCcw, AlertCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import MessageBubble from "@/components/asistente/MessageBubble";

const QUICK_QUESTIONS = [
  "¿Cuántos animales activos tengo por especie?",
  "¿Qué animales no se han pesado en más de 30 días?",
  "¿Qué animales están listos para venta?",
  "¿Cuáles tienen baja ganancia de peso?",
  "¿Qué tratamientos están pendientes o vencidos?",
  "Ventas y gastos del mes",
  "¿Cuál es el lote más rentable?",
  "Inconformidades abiertas y despachos pendientes",
  "¿Qué partos vienen en los próximos 30 días?",
  "¿Qué animales debería revisar primero?",
];

const DISCLAIMER = "Las recomendaciones del Asistente RJAPP son orientativas y se basan en los datos registrados en la aplicación. No reemplazan el criterio de un veterinario, zootecnista, contador o asesor profesional.";

export default function AsistenteRJAPP() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const subRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    return () => { if (subRef.current) subRef.current(); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const subscribe = (convId) => {
    if (subRef.current) subRef.current();
    subRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      setMessages(data.messages || []);
      const last = data.messages?.[data.messages.length - 1];
      if (last?.role === "assistant" && !last.tool_calls?.some((t) => ["pending", "running", "in_progress"].includes(t.status))) {
        setLoading(false);
      }
    });
  };

  const sendQuestion = async (text) => {
    if (!text.trim() || loading) return;
    let conv = conversation;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "asistente_rjapp",
        metadata: { name: "Asistente RJAPP" },
      });
      setConversation(conv);
      subscribe(conv.id);
    }
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } catch {
      setLoading(false);
    }
  };

  const newConversation = () => {
    if (subRef.current) { subRef.current(); subRef.current = null; }
    setConversation(null);
    setMessages([]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <PageHeader title="Asistente RJAPP" subtitle="Consulta y analiza tus datos con inteligencia artificial">
        <Button variant="outline" size="sm" className="gap-2" onClick={newConversation}>
          <RotateCcw className="w-4 h-4" /> Nueva consulta
        </Button>
      </PageHeader>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">{DISCLAIMER}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-black" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Asistente RJAPP</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Pregúntame sobre tus animales, gastos, ventas, tratamientos y más.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => sendQuestion(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {loading && messages.length > 0 && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick questions when active */}
      {messages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_QUESTIONS.slice(0, 5).map((q) => (
            <button key={q} onClick={() => sendQuestion(q)} disabled={loading}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendQuestion(input); }}
          placeholder="Escribe tu pregunta..."
          disabled={loading}
          className="h-11"
        />
        <Button className="gap-2 h-11 px-4" onClick={() => sendQuestion(input)} disabled={loading || !input.trim()}>
          {loading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}