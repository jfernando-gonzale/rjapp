// Format currency in Colombian pesos: $ 2.800.000
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return "$ 0";
  const num = Math.round(Number(value));
  return "$ " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse monetary input: accepts "10000", "10.000", "$10.000", "$ 10.000" → 10000
export function parseMoney(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
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

export const TIPO_PROCEDIMIENTO = {
  topizado: "Topizado",
  descorne: "Descorne",
  tatuaje: "Tatuaje",
  marcacion_hierro: "Marcación con hierro",
  chapeta: "Chapeta / Identificación",
  castracion: "Castración",
  palpacion: "Palpación",
  bano: "Baño",
  pesaje_especial: "Pesaje especial",
  revision_podal: "Revisión podal",
  arete: "Arete / Identificación",
  corte_cola: "Corte de cola",
  esquila: "Esquila",
  revision_pezuñas: "Revisión de pezuñas",
  desparasitacion_externa: "Desparasitación externa",
  herraje: "Herraje",
  recorte_cascos: "Recorte de cascos",
  odontologia: "Odontología",
  microchip: "Microchip",
  revision_veterinaria: "Revisión veterinaria",
  manejo_reproductivo: "Manejo reproductivo",
  otro: "Otro",
};

export const PROCEDIMIENTOS_POR_ESPECIE = {
  bovino: ["topizado", "descorne", "tatuaje", "marcacion_hierro", "chapeta", "castracion", "palpacion", "bano", "pesaje_especial", "revision_podal", "otro"],
  ovino: ["tatuaje", "arete", "marcacion_hierro", "castracion", "corte_cola", "esquila", "revision_pezuñas", "bano", "desparasitacion_externa", "otro"],
  equino: ["herraje", "recorte_cascos", "odontologia", "marcacion_hierro", "microchip", "revision_veterinaria", "manejo_reproductivo", "otro"],
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
  "Criollo", "Appaloosa", "Cuarto de Milla", "Pinto Americano",
  "Pura Sangre Español", "Pura Sangre Lusitano", "Otra"
];

// Calcula edad en formato "X años Y meses" o "Z meses" desde fecha de nacimiento.
// Devuelve string. "" si no hay fecha.
export function calcEdadDesdeNacimiento(fechaNacimiento) {
  if (!fechaNacimiento) return "";
  const nac = new Date(fechaNacimiento);
  if (isNaN(nac.getTime())) return "";
  const hoy = new Date();
  let anos = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (hoy.getDate() < nac.getDate()) meses--;
  if (meses < 0) { anos--; meses += 12; }
  // Caso: fecha futura o fecha de hoy → 0
  if (anos < 0) return "";
  if (anos === 0 && meses <= 0) return "Recién nacido";
  if (anos === 0) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  if (meses === 0) return `${anos} ${anos === 1 ? "año" : "años"}`;
  return `${anos} ${anos === 1 ? "año" : "años"} ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

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