// Constantes del módulo de Caballos / Reproducción de Yeguas

export const ESTADO_REPRODUCTIVO = {
  vacia: "Vacía",
  inseminada: "Inseminada",
  preñada: "Preñada",
  parida: "Parida",
  descanso: "En descanso",
  retirada: "Retirada",
};

export const ESTADO_REPRODUCTIVO_COLORS = {
  vacia: "bg-slate-100 text-slate-700",
  inseminada: "bg-blue-100 text-blue-700",
  preñada: "bg-emerald-100 text-emerald-700",
  parida: "bg-amber-100 text-amber-700",
  descanso: "bg-purple-100 text-purple-700",
  retirada: "bg-rose-100 text-rose-700",
};

export const ESTADO_CRIA = {
  lactante: "Lactante",
  destetada: "Destetada",
  vendida: "Vendida",
  muerta: "Muerta",
  activa: "Activa",
};

export const ESTADO_CRIA_COLORS = {
  lactante: "bg-blue-100 text-blue-700",
  destetada: "bg-emerald-100 text-emerald-700",
  vendida: "bg-amber-100 text-amber-700",
  muerta: "bg-rose-100 text-rose-700",
  activa: "bg-slate-100 text-slate-700",
};

export const TIPO_INSEMINACION = {
  inseminacion_artificial: "Inseminación artificial",
  monta_natural: "Monta natural",
};

export const RESULTADO_INSEMINACION = {
  pendiente: "Pendiente",
  preñada: "Preñada",
  repitio_celo: "Repitió celo",
  fallida: "Fallida",
  no_confirmado: "No confirmado",
};

export const RESULTADO_INSEMINACION_COLORS = {
  pendiente: "bg-amber-100 text-amber-700",
  preñada: "bg-emerald-100 text-emerald-700",
  repitio_celo: "bg-orange-100 text-orange-700",
  fallida: "bg-rose-100 text-rose-700",
  no_confirmado: "bg-slate-100 text-slate-700",
};

export const METODO_CONFIRMACION = {
  ecografia: "Ecografía",
  palpacion: "Palpación",
  observacion: "Observación",
  otro: "Otro",
};

export const RESULTADO_PARTO = {
  cria_viva: "Cría viva",
  cria_muerta: "Cría muerta",
  aborto: "Aborto",
  complicacion: "Complicación",
};

export const RESULTADO_PARTO_COLORS = {
  cria_viva: "bg-emerald-100 text-emerald-700",
  cria_muerta: "bg-rose-100 text-rose-700",
  aborto: "bg-red-100 text-red-700",
  complicacion: "bg-orange-100 text-orange-700",
};

export const SEXO_CRIA = {
  macho: "Macho",
  hembra: "Hembra",
  no_registrado: "No registrado",
};

export const NUEVA_ACCION_CELO = {
  reinseminar: "Volver a inseminar",
  observacion: "Dejar en observación",
  veterinario: "Revisar con veterinario",
  nada: "No hacer nada por ahora",
};

// Duración de gestación del caballo en días
export const DIAS_GESTACION = 340;

// Valores por defecto para alertas (días)
export const ALERTAS_DEFAULT = {
  dias_revisar_preñez_min: 15,
  dias_revisar_preñez_max: 30,
  dias_alerta_parto: 30,
  dias_alerta_parto_fuerte: 7,
  dias_destete_sugerido: 180, // 6 meses
};

// Calcular fecha probable de parto (inseminación + 340 días)
export function calcFechaProbableParto(fechaInseminacion) {
  if (!fechaInseminacion) return null;
  const fecha = new Date(fechaInseminacion);
  fecha.setDate(fecha.getDate() + DIAS_GESTACION);
  return fecha.toISOString().split("T")[0];
}

// Calcular días de gestación transcurridos
export function calcDiasGestacion(fechaInseminacion) {
  if (!fechaInseminacion) return null;
  const d1 = new Date(fechaInseminacion);
  const d2 = new Date();
  const diffTime = d2 - d1;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// Calcular días faltantes para el parto
export function calcDiasFaltantesParto(fechaProbableParto) {
  if (!fechaProbableParto) return null;
  const d1 = new Date();
  const d2 = new Date(fechaProbableParto);
  const diffTime = d2 - d1;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calcular edad al destete en días
export function calcEdadDestete(fechaNacimiento, fechaDestete) {
  if (!fechaNacimiento || !fechaDestete) return null;
  const d1 = new Date(fechaNacimiento);
  const d2 = new Date(fechaDestete);
  const diffTime = d2 - d1;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calcular fecha sugerida de destete (nacimiento + 6 meses aprox)
export function calcFechaDesteteSugerida(fechaNacimiento, diasDestete = ALERTAS_DEFAULT.dias_destete_sugerido) {
  if (!fechaNacimiento) return null;
  const fecha = new Date(fechaNacimiento);
  fecha.setDate(fecha.getDate() + diasDestete);
  return fecha.toISOString().split("T")[0];
}

// Calcular fecha de revisión de preñez (inseminación + días min)
export function calcFechaRevisionPreñez(fechaInseminacion, diasMin = ALERTAS_DEFAULT.dias_revisar_preñez_min) {
  if (!fechaInseminacion) return null;
  const fecha = new Date(fechaInseminacion);
  fecha.setDate(fecha.getDate() + diasMin);
  return fecha.toISOString().split("T")[0];
}