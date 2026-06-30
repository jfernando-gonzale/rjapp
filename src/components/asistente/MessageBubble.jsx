import React, { useState } from "react";
import { Bot, User, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const statusMap = {
  pending: { icon: Loader2, text: "Pendiente...", spin: true, color: "text-gray-400" },
  running: { icon: Loader2, text: "Ejecutando...", spin: true, color: "text-blue-500" },
  in_progress: { icon: Loader2, text: "En progreso...", spin: true, color: "text-blue-500" },
  completed: { icon: CheckCircle2, text: "Completado", color: "text-emerald-500" },
  success: { icon: CheckCircle2, text: "Éxito", color: "text-emerald-500" },
  failed: { icon: AlertCircle, text: "Falló", color: "text-red-500" },
  error: { icon: AlertCircle, text: "Error", color: "text-red-500" },
};

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusMap[toolCall.status] || statusMap.pending;
  const StatusIcon = status.icon;
  const failed = ["failed", "error"].includes(toolCall.status);

  let parsedResults = toolCall.results;
  try {
    if (typeof parsedResults === "string") parsedResults = JSON.parse(parsedResults);
  } catch { /* keep raw */ }

  const proj = toolCall.display_projection;
  const hideDetails = proj?.hide_details && proj?.details_redacted;

  if (hideDetails) {
    const label = failed ? (proj.error_label || "Operación fallida") : (status.spin ? (proj.active_label || status.text) : (proj.label || status.text));
    return (
      <div className={`flex items-center gap-1.5 text-xs ${failed ? "text-red-500" : status.color}`}>
        <StatusIcon className={`w-3 h-3 ${status.spin ? "animate-spin" : ""}`} />
        <span>{label}</span>
      </div>
    );
  }

  let parsedArgs = toolCall.arguments_string;
  try {
    if (typeof parsedArgs === "string") parsedArgs = JSON.parse(parsedArgs);
  } catch { /* keep raw */ }

  return (
    <div className="mt-1.5 text-xs border border-border/60 rounded-md bg-muted/30 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 w-full px-2 py-1.5 hover:bg-muted/50 transition-colors">
        <StatusIcon className={`w-3 h-3 ${status.spin ? "animate-spin" : ""} ${failed ? "text-red-500" : status.color}`} />
        <span className="font-medium capitalize">{toolCall.name || "consulta"}</span>
        <span className={failed ? "text-red-500" : status.color}>• {status.text}</span>
        <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <div className="px-2 pb-2 space-y-1">
          {parsedArgs && (
            <div>
              <p className="font-semibold text-muted-foreground">Parámetros:</p>
              <pre className="whitespace-pre-wrap break-all text-[10px] bg-muted/50 rounded p-1.5">{typeof parsedArgs === "string" ? parsedArgs : JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <p className="font-semibold text-muted-foreground">Resultado:</p>
              <pre className="whitespace-pre-wrap break-all text-[10px] bg-muted/50 rounded p-1.5 max-h-32 overflow-y-auto">{typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-black" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${isUser ? "bg-amber-500 text-black" : "bg-muted"}`}>
        {message.content && (
          isUser
            ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            : <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">{message.content}</ReactMarkdown>
        )}
        {message.tool_calls?.map((tc, idx) => <ToolCallDisplay key={idx} toolCall={tc} />)}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-gray-700" />
        </div>
      )}
    </div>
  );
}