import {
  Heart, Eye, Baby, GitBranch, Syringe, Scale, Fence, Truck, Droplet, ClipboardList, AlertTriangle
} from "lucide-react";

// Categorías de evento (tipo_evento) -> color e ícono
export const CATEGORIAS = {
  reproduccion: { label: "Reproducción", color: "amber", icon: Heart },
  tratamiento: { label: "Tratamientos", color: "purple", icon: Syringe },
  pesaje: { label: "Pesajes", color: "blue", icon: Scale },
  potrero: { label: "Potreros / Rotación", color: "emerald", icon: Fence },
  despacho: { label: "Despachos", color: "orange", icon: Truck },
  colecta: { label: "Colectas", color: "slate", icon: Droplet },
  tarea: { label: "Tareas generales", color: "gray", icon: ClipboardList },
};

export const ESPECIE_LABELS = {
  bovino: "Bovino",
  ovino: "Ovino",
  equino: "Equino",
  general: "General",
};

export const ESTADO_LABELS = {
  pendiente: "Pendiente",
  completado: "Completado",
  vencido: "Vencido",
  reprogramado: "Reprogramado",
  cancelado: "Cancelado",
};

export const ESTADO_COLORS = {
  pendiente: "yellow",
  completado: "green",
  vencido: "red",
  reprogramado: "blue",
  cancelado: "gray",
};

// Mapa de colores -> clases tailwind (literales para purge)
export const DOT_COLORS = {
  amber: "bg-amber-500",
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  orange: "bg-orange-500",
  slate: "bg-slate-700",
  gray: "bg-gray-400",
  red: "bg-red-500",
};

export const BORDER_COLORS = {
  amber: "border-amber-500",
  purple: "border-purple-500",
  blue: "border-blue-500",
  emerald: "border-emerald-500",
  orange: "border-orange-500",
  slate: "border-slate-700",
  gray: "border-gray-400",
  red: "border-red-500",
};

export const TEXT_COLORS = {
  amber: "text-amber-600",
  purple: "text-purple-600",
  blue: "text-blue-600",
  emerald: "text-emerald-600",
  orange: "text-orange-600",
  slate: "text-slate-700",
  gray: "text-gray-500",
  red: "text-red-600",
};

export const BG_SOFT = {
  amber: "bg-amber-50",
  purple: "bg-purple-50",
  blue: "bg-blue-50",
  emerald: "bg-emerald-50",
  orange: "bg-orange-50",
  slate: "bg-slate-100",
  gray: "bg-gray-100",
  red: "bg-red-50",
};

// Frecuencia -> días
export const FRECUENCIA_DIAS = {
  no_repite: 0,
  semanal: 7,
  mensual: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365,
};

// Frecuencias para tratamientos cíclicos
export const FRECUENCIA_TRAT_DIAS = {
  "15d": 15,
  "30d": 30,
  "2m": 60,
  "3m": 90,
  "6m": 180,
  "anual": 365,
};

export const FRECUENCIA_TRAT_LABELS = {
  "15d": "Cada 15 días",
  "30d": "Cada 30 días",
  "2m": "Cada 2 meses",
  "3m": "Cada 3 meses",
  "6m": "Cada 6 meses",
  "anual": "Cada año",
  personalizado: "Personalizado",
};

export const FRECUENCIA_LABELS = {
  no_repite: "No repetir",
  semanal: "Cada semana",
  mensual: "Cada mes",
  trimestral: "Cada 3 meses",
  semestral: "Cada 6 meses",
  anual: "Cada año",
  personalizado: "Personalizado",
};

export function sumarDias(fechaStr, dias) {
  if (!fechaStr || !dias) return null;
  const d = new Date(fechaStr);
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

// Calcula la próxima fecha según frecuencia
export function calcularProximaFecha(fechaStr, frecuencia, intervaloDias) {
  const dias = FRECUENCIA_DIAS[frecuencia] || (frecuencia === "personalizado" ? Number(intervaloDias) : 0);
  return dias ? sumarDias(fechaStr, dias) : null;
}

// Calcula próxima fecha para tratamientos (clave de FRECUENCIA_TRAT_DIAS)
export function calcularProximaFechaTrat(fechaStr, frecuencia, intervaloDias) {
  const dias = FRECUENCIA_TRAT_DIAS[frecuencia] || (frecuencia === "personalizado" ? Number(intervaloDias) : 0);
  return dias ? sumarDias(fechaStr, dias) : null;
}

export function estadoSegunFecha(fechaStr, estado) {
  if (estado !== "pendiente") return estado;
  const today = new Date().toISOString().split("T")[0];
  return fechaStr < today ? "vencido" : "pendiente";
}

export { AlertTriangle };