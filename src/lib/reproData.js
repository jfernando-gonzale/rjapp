import { daysBetween } from "@/lib/helpers";

export function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Eventos reproductivos de un animal (bovinos/ovinos) desde EventoCalendario
export function getReproEventos(animalId, eventos) {
  return eventos
    .filter(ev => ev.animal_id === animalId && ev.tipo_evento === "reproduccion")
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function getLastEvento(reproEventos, subtipos) {
  return reproEventos.find(ev => subtipos.includes(ev.subtipo));
}

const SUB_INSEM = ["inseminacion", "monta_natural", "servicio"];
const SUB_CONFIRMA = ["confirmacion_preñez", "confirmacion_prenez"];
const SUB_PARTO = ["parto"];

// Días abiertos para bovinos/ovinos
export function computeDaysOpenEventos(reproEventos, today) {
  const lastParto = getLastEvento(reproEventos, SUB_PARTO);
  const lastInsem = getLastEvento(reproEventos, SUB_INSEM);

  if (lastParto) {
    const days = daysBetween(lastParto.fecha, today);
    return {
      days,
      label: `Días abiertos: ${days}`,
      fechaBase: lastParto.fecha,
      fechaLabel: `Vacía desde: ${fmtDate(lastParto.fecha)}`,
    };
  }
  if (lastInsem) {
    const days = daysBetween(lastInsem.fecha, today);
    return {
      days,
      label: `Días desde último servicio: ${days}`,
      fechaBase: lastInsem.fecha,
      fechaLabel: `Último servicio: ${fmtDate(lastInsem.fecha)}`,
    };
  }
  return {
    days: null,
    label: "No hay datos suficientes para calcular días abiertos.",
    fechaBase: null,
    fechaLabel: "",
  };
}

// Motivo de revisión para bovinos/ovinos
export function getReviewReasonEventos(reproEventos, daysOpenInfo, diasLimite = 90) {
  const lastInsem = getLastEvento(reproEventos, SUB_INSEM);
  const lastConfirma = getLastEvento(reproEventos, SUB_CONFIRMA);
  const lastParto = getLastEvento(reproEventos, SUB_PARTO);

  if (!lastInsem && !lastParto) return "Sin servicio registrado";
  if (lastInsem && !lastConfirma) return "Sin confirmación de preñez después de inseminación";
  if (lastParto && !lastInsem) return "Parto registrado, pero sin nueva inseminación";
  if (daysOpenInfo.days !== null && daysOpenInfo.days > diasLimite) return `Más de ${daysOpenInfo.days} días abierta`;
  return "Hembra vacía";
}

// Construir item de detalle para un animal (bovinos/ovinos)
export function buildAnimalItem(animal, fincas, lotes, especie, extra = {}) {
  const finca = fincas.find(f => f.id === animal.finca_id);
  const lote = lotes.find(l => l.id === animal.lote_id);
  return {
    id: animal.id,
    numero: animal.numero || "—",
    nombre: animal.nombre || "",
    especie,
    finca: finca?.nombre || "—",
    lote: lote?.nombre || "—",
    estadoReproductivo: extra.estadoReproductivo || "—",
    motivo: extra.motivo || "",
    fechaRelevante: extra.fechaRelevante || "",
    diasTranscurridos: extra.diasTranscurridos ?? null,
    diasLabel: extra.diasLabel || "",
    accionSugerida: extra.accionSugerida || "",
    link: `/animales/${animal.id}`,
    ultimoParto: extra.ultimoParto || "—",
    ultimaInseminacion: extra.ultimaInseminacion || "—",
    prenezConfirmada: extra.prenezConfirmada || "No",
    fechaProbableParto: extra.fechaProbableParto || "—",
    repeticiones: extra.repeticiones || 0,
  };
}

// Días abiertos para equinos (usando entidad Yegua)
export function computeDaysOpenYegua(yegua, inseminaciones, partos, today) {
  const yPartos = partos.filter(p => p.yegua_id === yegua.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const yInsems = inseminaciones.filter(i => i.yegua_id === yegua.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (yPartos.length > 0) {
    const days = daysBetween(yPartos[0].fecha, today);
    return { days, label: `Días abiertos: ${days}`, fechaBase: yPartos[0].fecha, fechaLabel: `Vacía desde: ${fmtDate(yPartos[0].fecha)}` };
  }
  if (yInsems.length > 0) {
    const days = daysBetween(yInsems[0].fecha, today);
    return { days, label: `Días desde último servicio: ${days}`, fechaBase: yInsems[0].fecha, fechaLabel: `Último servicio: ${fmtDate(yInsems[0].fecha)}` };
  }
  if (yegua.fecha_ultimo_parto) {
    const days = daysBetween(yegua.fecha_ultimo_parto, today);
    return { days, label: `Días desde último parto: ${days}`, fechaBase: yegua.fecha_ultimo_parto, fechaLabel: `Último parto: ${fmtDate(yegua.fecha_ultimo_parto)}` };
  }
  if (yegua.fecha_ultima_inseminacion) {
    const days = daysBetween(yegua.fecha_ultima_inseminacion, today);
    return { days, label: `Días desde último servicio: ${days}`, fechaBase: yegua.fecha_ultima_inseminacion, fechaLabel: `Último servicio: ${fmtDate(yegua.fecha_ultima_inseminacion)}` };
  }
  return { days: null, label: "No hay datos suficientes para calcular días abiertos.", fechaBase: null, fechaLabel: "" };
}

// Motivo de revisión para equinos
export function getReviewReasonYegua(yegua, inseminaciones, confirmaciones, partos, daysOpenInfo, inconformidades = []) {
  const yInsems = inseminaciones.filter(i => i.yegua_id === yegua.id);
  const yConfirma = confirmaciones.filter(c => c.yegua_id === yegua.id);
  const yPartos = partos.filter(p => p.yegua_id === yegua.id);
  const yInconformidades = inconformidades.filter(i => i.reproductor_id === yegua.id || i.yegua_cliente?.includes(yegua.nombre));

  if (yegua.estado_reproductivo === "inseminada" && yConfirma.length === 0) return "Receptora pendiente de confirmación";
  if (yegua.repeticiones_celo > 0) return "Repetición registrada";
  if (yInsems.length > 0 && yConfirma.length === 0 && yegua.estado_reproductivo !== "preñada") return "Transferencia sin resultado";
  if (yInconformidades.some(i => i.estado === "abierta")) return "Inconformidad abierta";
  if (yegua.estado_reproductivo === "vacia" && yInsems.length === 0) return "Yegua sin preñez confirmada";
  if (daysOpenInfo.days !== null && daysOpenInfo.days > 120) return `Más de ${daysOpenInfo.days} días abierta`;
  if (yegua.estado_reproductivo === "vacia") return "Yegua vacía";
  return "Requiere seguimiento reproductivo";
}

export function esReceptora(yegua) {
  const nombre = (yegua.nombre || "").toLowerCase();
  const numero = yegua.numero || "";
  return nombre.includes("receptora") || numero.includes("RECEP") || numero.includes("REC");
}