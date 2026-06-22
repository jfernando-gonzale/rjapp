// Format currency
export function formatCurrency(value, currency = "COP") {
  if (value == null || isNaN(value)) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format weight
export function formatWeight(value, unit = "kg") {
  if (value == null || isNaN(value)) return "0 kg";
  return `${Number(value).toLocaleString("es-CO", { maximumFractionDigits: 1 })} ${unit}`;
}

// Format number
export function formatNumber(value, decimals = 1) {
  if (value == null || isNaN(value)) return "0";
  return Number(value).toLocaleString("es-CO", { maximumFractionDigits: decimals });
}

// Days between two dates
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate daily gain
export function calcDailyGain(weightNew, weightOld, days) {
  if (!days || days === 0 || weightOld == null || weightNew == null) return null;
  return (weightNew - weightOld) / days;
}

// Get gain indicator color
export function getGainColor(dailyGain, goodThreshold = 0.8, mediumThreshold = 0.4) {
  if (dailyGain == null) return "gray";
  if (dailyGain >= goodThreshold) return "green";
  if (dailyGain >= mediumThreshold) return "yellow";
  return "red";
}

// Get gain label
export function getGainLabel(color) {
  const labels = {
    green: "Buena",
    yellow: "Regular",
    red: "Baja",
    gray: "Sin datos"
  };
  return labels[color] || "Sin datos";
}

// Category labels
export const CATEGORIA_GASTOS = {
  compra_animales: "Compra de animales",
  sal: "Sal",
  concentrado: "Concentrado",
  pasto: "Pasto / Alimentación",
  medicina: "Medicina",
  vitaminas: "Vitaminas",
  purgas: "Purgas",
  vacunas: "Vacunas",
  veterinario: "Veterinario",
  transporte: "Transporte",
  jornales: "Jornales / Mano de obra",
  arriendo: "Arriendo",
  mantenimiento: "Mantenimiento",
  insumos: "Insumos",
  comisiones: "Comisiones",
  otros: "Otros",
};

export const TIPO_TRATAMIENTO = {
  vitamina: "Vitamina",
  purga: "Purga",
  vacuna: "Vacuna",
  antibiotico: "Antibiótico",
  bano: "Baño",
  desparasitacion: "Desparasitación",
  medicamento: "Medicamento",
  otro: "Otro",
};

export const TIPO_LOTE = {
  levante: "Levante",
  ceba: "Ceba",
  cria: "Cría",
  reproduccion: "Reproducción",
  descarte: "Descarte",
  otro: "Otro",
};

export const ESTADO_ANIMAL = {
  activo: "Activo",
  vendido: "Vendido",
  muerto: "Muerto",
  descartado: "Descartado",
  trasladado: "Trasladado",
};

export const SEXO_ANIMAL = {
  macho: "Macho",
  hembra: "Hembra",
};

export const ESPECIES = {
  bovino: "Bovino",
  ovino: "Ovino",
  equino: "Equino",
};

export const RAZAS_BOVINAS = [
  "Brahman Rojo", "Brahman Blanco", "Gyr", "Guzerá",
  "Angus Rojo", "Angus Negro", "Charolais",
  "Girolando", "Girolando Plus", "Brangus", "Simbrah",
  "Holstein", "Jersey", "Cebú Comercial", "Cruce", "Otra"
];

export const RAZAS_OVINAS = [
  "Katahdin", "Pelibuey", "Santa Inés", "Black Belly",
  "Dorper", "Hampshire", "Suffolk", "Criolla", "Cruce", "Otra"
];

export const RAZAS_EQUINAS = [
  "Criollo", "Apalusa", "Cuarto de Milla", "Pinto Americano",
  "Pura Sangre Español", "Pura Sangre Lusitano", "Otra"
];

export function getRazasByEspecie(especie) {
  if (especie === "bovino") return RAZAS_BOVINAS;
  if (especie === "ovino") return RAZAS_OVINAS;
  if (especie === "equino") return RAZAS_EQUINAS;
  return [];
}

export const TIPO_CLIENTE = {
  bovinos: "Bovinos",
  ovinos: "Ovinos",
  equinos: "Equinos",
  semen_equino: "Semen Equino",
  general: "General",
};

export const TIPO_VENTA = {
  bovino: "Animal Bovino",
  ovino: "Animal Ovino",
  equino: "Animal Equino",
  semen_equino: "Semen Equino",
  servicio_reproductivo: "Servicio Reproductivo",
  otro: "Otro",
};

export const LINEAS_PRODUCTIVAS = {
  ceba_bovina: "Ceba Bovina",
  reproduccion_bovina: "Reproducción Bovina",
  ceba_ovina: "Ceba Ovina",
  cria_ovina: "Cría Ovina",
  yeguas_equinas: "Yeguas Equinas",
  receptoras_equinas: "Receptoras Equinas",
  reproductores_equinos: "Reproductores Equinos",
  semen_fresco: "Semen Fresco",
  general_finca: "General Finca",
};