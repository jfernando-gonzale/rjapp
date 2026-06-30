import {
  Heart, Eye, Baby, GitBranch, Syringe, Scale, Truck, Droplet, Fence, ClipboardList, Wrench
} from "lucide-react";
import { calcFechaDesteteSugerida, ALERTAS_DEFAULT } from "@/lib/caballos";
import { TIPO_PROCEDIMIENTO } from "@/lib/helpers";

const TIPO_TRATAMIENTO_LABELS = {
  vitamina: "Vitamina",
  purga: "Purga",
  vacuna: "Vacuna",
  antibiotico: "Antibiótico",
  bano: "Baño",
  desparasitacion: "Desparasitación",
  medicamento: "Medicamento",
  otro: "Otro",
};

// Construye una lista unificada de eventos derivados de los módulos + eventos manuales.
// Cada evento: { id, titulo, tipo_evento, subtipo, especie, finca_id, lote_id, animal_id, fecha, hora, estado, origen, origen_id, es_derivado, observaciones, responsable, color, icon }
export function construirEventos({
  yeguas, inseminaciones, confirmaciones, partos, crias,
  tratamientos, pesajes, despachos, colectas, lotes, fincas, animales,
  eventosManuales, procedimientos = [],
}) {
  const events = [];

  const fincaNombre = (id) => fincas.find(f => f.id === id)?.nombre || "";
  const loteNombre = (id) => lotes.find(l => l.id === id)?.nombre || "";
  const yeguaNombre = (id) => yeguas.find(y => y.id === id)?.nombre || "?";
  const animalNumero = (id) => animales.find(a => a.id === id)?.numero || "";

  // ===== REPRODUCCIÓN =====
  inseminaciones.forEach((i) => {
    if (!i.fecha) return;
    events.push({
      id: `ins-${i.id}`,
      titulo: `Inseminación: ${yeguaNombre(i.yegua_id)}`,
      tipo_evento: "reproduccion",
      subtipo: "inseminacion",
      especie: "equino",
      yegua_id: i.yegua_id,
      fecha: i.fecha,
      estado: "pendiente",
      origen: "reproduccion",
      origen_id: i.id,
      es_derivado: true,
      observaciones: i.observaciones,
      color: "amber",
      icon: Heart,
    });
  });

  inseminaciones
    .filter((i) => i.resultado === "pendiente")
    .forEach((i) => {
      if (!i.fecha) return;
      const fechaRev = new Date(i.fecha);
      fechaRev.setDate(fechaRev.getDate() + ALERTAS_DEFAULT.dias_revisar_preñez_min);
      events.push({
        id: `rev-${i.id}`,
        titulo: `Revisar preñez: ${yeguaNombre(i.yegua_id)}`,
        tipo_evento: "reproduccion",
        subtipo: "revision_preñez",
        especie: "equino",
        yegua_id: i.yegua_id,
        fecha: fechaRev.toISOString().split("T")[0],
        estado: "pendiente",
        origen: "reproduccion",
        origen_id: i.id,
        es_derivado: true,
        color: "amber",
        icon: Eye,
      });
    });

  confirmaciones.forEach((c) => {
    if (!c.fecha) return;
    events.push({
      id: `conf-${c.id}`,
      titulo: `Preñez confirmada: ${yeguaNombre(c.yegua_id)}`,
      tipo_evento: "reproduccion",
      subtipo: "confirmacion",
      especie: "equino",
      yegua_id: c.yegua_id,
      fecha: c.fecha,
      estado: "completado",
      origen: "reproduccion",
      origen_id: c.id,
      es_derivado: true,
      color: "amber",
      icon: Eye,
    });
  });

  yeguas.forEach((y) => {
    if (y.fecha_probable_parto) {
      events.push({
        id: `parto-prob-${y.id}`,
        titulo: `Parto probable: ${y.nombre}`,
        tipo_evento: "reproduccion",
        subtipo: "parto_probable",
        especie: "equino",
        yegua_id: y.id,
        fecha: y.fecha_probable_parto,
        estado: "pendiente",
        origen: "reproduccion",
        origen_id: y.id,
        es_derivado: true,
        color: "amber",
        icon: Baby,
      });
    }
  });

  partos.forEach((p) => {
    if (!p.fecha) return;
    events.push({
      id: `parto-${p.id}`,
      titulo: `Parto: ${yeguaNombre(p.yegua_id)}`,
      tipo_evento: "reproduccion",
      subtipo: "parto",
      especie: "equino",
      yegua_id: p.yegua_id,
      fecha: p.fecha,
      estado: "completado",
      origen: "reproduccion",
      origen_id: p.id,
      es_derivado: true,
      color: "amber",
      icon: Baby,
    });
  });

  crias.filter((c) => c.estado === "lactante").forEach((c) => {
    if (!c.fecha_nacimiento) return;
    const fechaDestete = calcFechaDesteteSugerida(c.fecha_nacimiento);
    events.push({
      id: `destete-${c.id}`,
      titulo: `Destete sugerido: ${c.nombre || "Cría de " + yeguaNombre(c.madre_id)}`,
      tipo_evento: "reproduccion",
      subtipo: "destete",
      especie: "equino",
      cria_id: c.id,
      fecha: fechaDestete,
      estado: "pendiente",
      origen: "reproduccion",
      origen_id: c.id,
      es_derivado: true,
      color: "amber",
      icon: GitBranch,
    });
  });

  // ===== TRATAMIENTOS (fecha + próxima fecha) =====
  const today = new Date().toISOString().split("T")[0];
  tratamientos.forEach((t) => {
    if (!t.fecha) return;
    const especie = t.especie || animales.find((a) => a.id === t.animal_id)?.especie || "bovino";
    const sujeto =
      t.tipo_registro === "lote"
        ? loteNombre(t.lote_id) || `Lote (${t.numero_animales || 0} animales)`
        : `#${animalNumero(t.animal_id)}`;
    const eventoBase = {
      tipo_evento: "tratamiento",
      subtipo: t.tipo,
      especie,
      finca_id: t.finca_id,
      lote_id: t.lote_id,
      animal_id: t.animal_id,
      finca: fincaNombre(t.finca_id),
      lote: loteNombre(t.lote_id),
      animal: animalNumero(t.animal_id),
      observaciones: t.observaciones,
      responsable: t.responsable,
      color: "purple",
      icon: Syringe,
    };
    events.push({
      ...eventoBase,
      id: `trat-${t.id}`,
      titulo: `Tratamiento ${TIPO_TRATAMIENTO_LABELS[t.tipo] || t.tipo}${t.producto ? `: ${t.producto}` : ""} - ${sujeto}`,
      fecha: t.fecha,
      estado: "completado",
      origen: "tratamiento",
      origen_id: t.id,
      es_derivado: true,
    });
    if (t.proxima_fecha && t.proxima_fecha >= today) {
      events.push({
        ...eventoBase,
        id: `trat-prox-${t.id}`,
        titulo: `Próxima ${TIPO_TRATAMIENTO_LABELS[t.tipo] || t.tipo}${t.producto ? ` (${t.producto})` : ""} - ${sujeto}`,
        fecha: t.proxima_fecha,
        estado: "pendiente",
        origen: "tratamiento",
        origen_id: t.id,
        es_derivado: true,
      });
    }
  });

  // ===== PROCEDIMIENTOS / MANEJOS (fecha + próxima revisión) =====
  procedimientos.forEach((p) => {
    if (!p.fecha) return;
    const especie = p.especie || animales.find((a) => a.id === p.animal_id)?.especie || "bovino";
    const sujeto =
      p.tipo_registro === "lote"
        ? loteNombre(p.lote_id) || `Lote (${p.numero_animales || 0} animales)`
        : `#${animalNumero(p.animal_id)}`;
    const eventoBase = {
      tipo_evento: "tratamiento",
      subtipo: p.tipo,
      especie,
      finca_id: p.finca_id,
      lote_id: p.lote_id,
      animal_id: p.animal_id,
      finca: fincaNombre(p.finca_id),
      lote: loteNombre(p.lote_id),
      animal: animalNumero(p.animal_id),
      observaciones: p.observaciones,
      responsable: p.responsable,
      color: "amber",
      icon: Wrench,
    };
    events.push({
      ...eventoBase,
      id: `proc-${p.id}`,
      titulo: `Procedimiento ${TIPO_PROCEDIMIENTO[p.tipo] || p.tipo}${p.detalle ? `: ${p.detalle}` : ""} - ${sujeto}`,
      fecha: p.fecha,
      estado: "completado",
      origen: "tratamiento",
      origen_id: p.id,
      es_derivado: true,
    });
    if (p.proxima_fecha && p.proxima_fecha >= today) {
      events.push({
        ...eventoBase,
        id: `proc-prox-${p.id}`,
        titulo: `Próxima revisión ${TIPO_PROCEDIMIENTO[p.tipo] || p.tipo} - ${sujeto}`,
        fecha: p.proxima_fecha,
        estado: "pendiente",
        origen: "tratamiento",
        origen_id: p.id,
        es_derivado: true,
      });
    }
  });

  // ===== PESAJES =====
  // Animales activos sin pesar en 45 días -> próximo pesaje recomendado
  const hoy = new Date();
  animales.filter((a) => a.estado === "activo").forEach((a) => {
    const ultima = a.fecha_ultimo_pesaje || a.fecha_compra;
    if (!ultima) {
      events.push({
        id: `pesaje-sin-${a.id}`,
        titulo: `Animal sin pesar: #${a.numero}`,
        tipo_evento: "pesaje",
        subtipo: "sin_pesar",
        especie: a.especie || "bovino",
        animal_id: a.id,
        animal: a.numero,
        fecha: today,
        estado: "vencido",
        origen: "pesaje",
        origen_id: a.id,
        es_derivado: true,
        color: "blue",
        icon: Scale,
      });
      return;
    }
    const u = new Date(ultima);
    const dias = Math.floor((hoy - u) / 86400000);
    if (dias >= 45) {
      // próximo pesaje recomendado: hoy
      events.push({
        id: `pesaje-rec-${a.id}`,
        titulo: `Pesaje pendiente: #${a.numero} (último hace ${dias}d)`,
        tipo_evento: "pesaje",
        subtipo: "recomendado",
        especie: a.especie || "bovino",
        animal_id: a.id,
        animal: a.numero,
        fecha: today,
        estado: "vencido",
        origen: "pesaje",
        origen_id: a.id,
        es_derivado: true,
        color: "blue",
        icon: Scale,
      });
    }
  });
  // Pesajes registrados
  pesajes.forEach((p) => {
    if (!p.fecha) return;
    events.push({
      id: `pesaje-${p.id}`,
      titulo: "Pesaje realizado",
      tipo_evento: "pesaje",
      subtipo: "pesaje",
      especie: animales.find((a) => a.id === p.animal_id)?.especie || "bovino",
      animal_id: p.animal_id,
      animal: animalNumero(p.animal_id),
      fecha: p.fecha,
      estado: "completado",
      origen: "pesaje",
      origen_id: p.id,
      es_derivado: true,
      color: "blue",
      icon: Scale,
    });
  });

  // ===== POTREROS / ROTACIÓN =====
  // Eventos manuales de potrero se manejan vía EventoCalendario; aquí derivamos lotes activos sin fecha de salida (sugerencia de revisión)
  // (Se incluye solo si el usuario crea eventos de potrero manualmente, la derivación automática es leve)
  lotes.filter((l) => l.estado === "activo").forEach((l) => {
    if (l.fecha_inicio) {
      const fin = new Date(l.fecha_inicio);
      fin.setDate(fin.getDate() + 90);
      if (l.fecha_inicio <= today) {
        events.push({
          id: `pot-rev-${l.id}`,
          titulo: `Revisar rotación: ${l.nombre || loteNombre(l.id)}`,
          tipo_evento: "potrero",
          subtipo: "rotacion",
          especie: l.especie === "mixto" ? "general" : l.especie || "bovino",
          lote_id: l.id,
          lote: l.nombre || loteNombre(l.id),
          finca_id: l.finca_id,
          finca: fincaNombre(l.finca_id),
          fecha: fin.toISOString().split("T")[0],
          estado: "pendiente",
          origen: "potrero",
          origen_id: l.id,
          es_derivado: true,
          color: "emerald",
          icon: Fence,
        });
      }
    }
  });

  // ===== DESPACHOS =====
  despachos.forEach((d) => {
    if (!d.fecha_despacho) return;
    events.push({
      id: `desp-${d.id}`,
      titulo: `Despacho: ${d.numero_dosis || 0} dosis → ${d.ciudad_destino || ""}`,
      tipo_evento: "despacho",
      subtipo: "despacho",
      especie: "equino",
      finca_id: d.cliente_id,
      fecha: d.fecha_despacho,
      hora: "",
      estado: d.estado === "entregado" ? "completado" : "pendiente",
      origen: "despacho",
      origen_id: d.id,
      es_derivado: true,
      observaciones: d.observaciones,
      color: "orange",
      icon: Truck,
    });
  });

  // ===== COLECTAS =====
  colectas.forEach((c) => {
    if (!c.fecha) return;
    events.push({
      id: `col-${c.id}`,
      titulo: `Colecta: ${c.numero_dosis || 0} dosis`,
      tipo_evento: "colecta",
      subtipo: "colecta",
      especie: "equino",
      reproductor_id: c.reproductor_id,
      fecha: c.fecha,
      hora: c.hora || "",
      estado: "completado",
      origen: "colecta",
      origen_id: c.id,
      es_derivado: true,
      observaciones: c.observaciones,
      color: "slate",
      icon: Droplet,
    });
  });

  // ===== EVENTOS MANUALES =====
  eventosManuales.forEach((ev) => {
    const cat = ev.tipo_evento || "tarea";
    const colorMap = {
      reproduccion: "amber",
      tratamiento: "purple",
      pesaje: "blue",
      potrero: "emerald",
      despacho: "orange",
      colecta: "slate",
      tarea: "gray",
    };
    const iconMap = {
      reproduccion: Heart,
      tratamiento: Syringe,
      pesaje: Scale,
      potrero: Fence,
      despacho: Truck,
      colecta: Droplet,
      tarea: ClipboardList,
    };
    events.push({
      id: `man-${ev.id}`,
      titulo: ev.titulo,
      tipo_evento: cat,
      subtipo: ev.subtipo || "",
      especie: ev.especie || "general",
      finca_id: ev.finca_id,
      lote_id: ev.lote_id,
      animal_id: ev.animal_id,
      finca: fincaNombre(ev.finca_id),
      lote: loteNombre(ev.lote_id),
      animal: animalNumero(ev.animal_id),
      fecha: ev.fecha,
      hora: ev.hora || "",
      estado: ev.estado || "pendiente",
      observaciones: ev.observaciones,
      origen: "manual",
      origen_id: ev.id,
      es_derivado: false,
      color: colorMap[cat],
      icon: iconMap[cat],
    });
  });

  return events;
}

export { TIPO_TRATAMIENTO_LABELS };