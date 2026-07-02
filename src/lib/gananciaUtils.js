import { daysBetween } from "@/lib/helpers";

export const DEFAULT_THRESHOLDS = {
  bovino: { excelente: 0.80, bueno: 0.50, regular: 0.25, bajo: 0.01 },
  ovino: { excelente: 0.25, bueno: 0.15, regular: 0.08, bajo: 0.01 },
  equino: { excelente: 0.60, bueno: 0.35, regular: 0.15, bajo: 0.01 },
};

export const DEFAULT_SALE_WEIGHTS = {
  bovino: { peso_minimo_alerta: 400, peso_objetivo: 420, peso_ideal: 450 },
  ovino: { peso_minimo_alerta: 30, peso_objetivo: 35, peso_ideal: 40 },
};

export function getThresholds(user) {
  if (!user) return DEFAULT_THRESHOLDS;
  try {
    const raw = user.umbrales_productivos;
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      bovino: { ...DEFAULT_THRESHOLDS.bovino, ...(parsed.bovino || {}) },
      ovino: { ...DEFAULT_THRESHOLDS.ovino, ...(parsed.ovino || {}) },
      equino: { ...DEFAULT_THRESHOLDS.equino, ...(parsed.equino || {}) },
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function getSaleWeights(user) {
  if (!user) return DEFAULT_SALE_WEIGHTS;
  try {
    const raw = user.pesos_objetivo_venta;
    if (!raw) return DEFAULT_SALE_WEIGHTS;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      bovino: { ...DEFAULT_SALE_WEIGHTS.bovino, ...(parsed.bovino || {}) },
      ovino: { ...DEFAULT_SALE_WEIGHTS.ovino, ...(parsed.ovino || {}) },
    };
  } catch {
    return DEFAULT_SALE_WEIGHTS;
  }
}

export function classifySaleStatus(peso, especie, saleWeights) {
  if (especie !== "bovino" && especie !== "ovino") return null;
  const sw = (saleWeights && saleWeights[especie]) || DEFAULT_SALE_WEIGHTS[especie];
  if (!sw || peso == null || isNaN(peso)) {
    return { level: "no_data", label: "Sin datos suficientes", color: "gray", diff: null };
  }
  if (peso >= sw.peso_objetivo) {
    return { level: "ready_sale", label: "Listo para venta", color: "emerald", diff: Math.round(peso - sw.peso_objetivo) };
  }
  if (peso >= sw.peso_minimo_alerta) {
    return { level: "near_target", label: "Cerca del objetivo", color: "amber", diff: Math.round(sw.peso_objetivo - peso) };
  }
  return { level: "growing", label: "En crecimiento", color: "blue", diff: Math.round(sw.peso_objetivo - peso) };
}

export function classifyGain(gain, especie, thresholds) {
  const t = (thresholds && thresholds[especie]) || DEFAULT_THRESHOLDS[especie] || DEFAULT_THRESHOLDS.bovino;
  if (gain == null || isNaN(gain))
    return { level: "sin_datos", label: "Sin datos", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };
  if (gain >= t.excelente)
    return { level: "excelente", label: "Excelente", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" };
  if (gain >= t.bueno)
    return { level: "bueno", label: "Bueno", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" };
  if (gain >= t.regular)
    return { level: "regular", label: "Regular", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" };
  if (gain >= t.bajo)
    return { level: "bajo", label: "Bajo", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" };
  return { level: "critico", label: "Crítico", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
}

export function calcGainFromPesajes(pesajes) {
  if (!pesajes || pesajes.length < 2) return null;
  const sorted = [...pesajes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const dias = daysBetween(prev.fecha, last.fecha);
  if (dias === 0) return null;
  return {
    gain: (last.peso - prev.peso) / dias,
    pesoActual: last.peso,
    pesoAnterior: prev.peso,
    dias,
    fecha: last.fecha,
  };
}

export function isPotro(animal) {
  if (!animal || (animal.especie || "bovino") !== "equino") return false;
  if (animal.edad_aproximada) {
    const m = animal.edad_aproximada.toLowerCase();
    const numMeses = parseInt(m);
    if (m.includes("mes") && numMeses < 24) return true;
    if (m.includes("año") && numMeses < 3) return true;
  }
  if (animal.fecha_nacimiento) {
    const dias = daysBetween(animal.fecha_nacimiento, new Date().toISOString().split("T")[0]);
    return dias < 730;
  }
  return false;
}

export function buildProductiveAlerts(animals, pesajes, tratamientos, eventos, thresholds, saleWeights) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];
  const now = new Date(today);

  const pesajesByAnimal = {};
  (pesajes || []).forEach(p => {
    if (!pesajesByAnimal[p.animal_id]) pesajesByAnimal[p.animal_id] = [];
    pesajesByAnimal[p.animal_id].push(p);
  });

  (animals || []).filter(a => a.estado === "activo").forEach(a => {
    const especie = a.especie || "bovino";
    const aPesajes = pesajesByAnimal[a.id] || [];
    const gainInfo = calcGainFromPesajes(aPesajes);
    const classification = gainInfo ? classifyGain(gainInfo.gain, especie, thresholds) : null;

    // Low or negative gain
    if (classification && (classification.level === "bajo" || classification.level === "critico")) {
      alerts.push({
        type: "low_gain",
        severity: classification.level === "critico" ? "danger" : "warning",
        animal_id: a.id,
        numero: a.numero,
        especie,
        message: `${a.numero}: ganancia ${gainInfo.gain.toFixed(2)} kg/día (${classification.label})`,
        detail: `Peso: ${gainInfo.pesoActual} kg · Último pesaje: ${gainInfo.fecha}`,
      });
    }

    // No weighing in 30+ days
    if (aPesajes.length === 0 || !a.fecha_ultimo_pesaje) {
      alerts.push({
        type: "no_pesaje",
        severity: "warning",
        animal_id: a.id,
        numero: a.numero,
        especie,
        message: `${a.numero}: sin pesajes registrados`,
        detail: "No hay pesajes para evaluar ganancia",
      });
    } else {
      const dias = daysBetween(a.fecha_ultimo_pesaje, today);
      if (dias > 30) {
        alerts.push({
          type: "no_pesaje_reciente",
          severity: "warning",
          animal_id: a.id,
          numero: a.numero,
          especie,
          message: `${a.numero}: sin pesaje hace ${dias} días`,
          detail: `Último pesaje: ${a.fecha_ultimo_pesaje}`,
        });
      }
    }

    // Sale weight alerts (bovinos and ovinos only)
    if ((especie === "bovino" || especie === "ovino") && a.ultimo_peso) {
      const sw = (saleWeights && saleWeights[especie]) || DEFAULT_SALE_WEIGHTS[especie];
      if (sw && a.ultimo_peso >= sw.peso_objetivo) {
        alerts.push({
          type: "ready_sale",
          severity: "info",
          animal_id: a.id,
          numero: a.numero,
          especie,
          message: `${a.numero}: listo para venta (${a.ultimo_peso} kg)`,
          detail: `Objetivo: ${sw.peso_objetivo} kg · ${Math.round(a.ultimo_peso - sw.peso_objetivo)} kg por encima`,
        });
      } else if (sw && a.ultimo_peso >= sw.peso_minimo_alerta) {
        alerts.push({
          type: "near_sale",
          severity: "warning",
          animal_id: a.id,
          numero: a.numero,
          especie,
          message: `${a.numero}: cerca del peso objetivo (${a.ultimo_peso} kg)`,
          detail: `Faltan ${Math.round(sw.peso_objetivo - a.ultimo_peso)} kg para venta`,
        });
      }
    }
  });

  // Overdue treatments
  (tratamientos || []).forEach(t => {
    if (t.proxima_fecha && t.proxima_fecha < today) {
      alerts.push({
        type: "tratamiento_vencido",
        severity: "danger",
        message: `Tratamiento vencido: ${t.producto || t.tipo}`,
        detail: `Fecha: ${t.proxima_fecha}`,
      });
    }
  });

  // Overdue reproductive events
  (eventos || []).forEach(ev => {
    if (ev.tipo_evento === "reproduccion" && ev.estado === "vencido") {
      alerts.push({
        type: "evento_reproductivo_vencido",
        severity: "warning",
        message: `Evento reproductivo vencido: ${ev.titulo}`,
        detail: `Fecha: ${ev.fecha}`,
      });
    }
  });

  return alerts;
}