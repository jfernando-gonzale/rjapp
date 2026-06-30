import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Heart, Baby, AlertCircle, Activity, Users, FlaskConical, Truck, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { daysBetween } from "@/lib/helpers";
import ReproInteractivo from "./ReproInteractivo";
import { AccionCell } from "./ReproDetalleTable";
import {
  fmtDate, getReproEventos, computeDaysOpenEventos, getReviewReasonEventos,
  buildAnimalItem, computeDaysOpenYegua, getReviewReasonYegua, esReceptora,
} from "@/lib/reproData";

const TOOLTIPS = {
  diasAbiertos: "Días abiertos: tiempo entre el último parto y la siguiente preñez o servicio efectivo. Mientras más alto sea, más tiempo improductiva permanece la hembra.",
  prolificidad: "Prolificidad: número promedio de crías nacidas por parto. Se calcula como total de crías nacidas dividido entre total de partos.",
  intervaloPartos: "Intervalo entre partos: tiempo promedio entre partos consecutivos. Un intervalo corto indica mejor eficiencia reproductiva.",
  tasaPreñez: "Tasa de preñez: porcentaje de hembras preñadas sobre el total de hembras reproductivas activas.",
  mortalidad: "Mortalidad de corderos: porcentaje de corderos muertos sobre el total de nacidos vivos y muertos.",
  partosPorAno: "Partos por año: número de partos por hembra por año. En ovinos, el ideal es 1.5 o más.",
  tasaExito: "Tasa de éxito por transferencia: porcentaje de preñeces confirmadas sobre el total de inseminaciones/transferencias realizadas.",
};

function NoData({ msg }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" /> {msg || "No hay datos suficientes para calcular este indicador."}
      </p>
    </Card>
  );
}

// Columnas de tabla para bovinos/ovinos
const COLS_BOV_OVI = (actionLinksFn) => [
  { key: "numero", label: "Animal", render: (i) => <span className="font-medium">#{i.numero}{i.nombre ? ` · ${i.nombre}` : ""}</span> },
  { key: "finca", label: "Finca" },
  { key: "lote", label: "Lote" },
  { key: "estadoReproductivo", label: "Estado reprod.", render: (i) => <span className="capitalize">{i.estadoReproductivo}</span> },
  { key: "ultimoParto", label: "Último parto" },
  { key: "ultimaInseminacion", label: "Última inseminación" },
  { key: "prenezConfirmada", label: "Preñez" },
  { key: "diasLabel", label: "Días abiertos" },
  { key: "motivo", label: "Motivo revisión" },
  { key: "accion", label: "Acción", render: (i) => <AccionCell item={i} actionLinks={actionLinksFn ? actionLinksFn(i) : []} /> },
];

// Columnas para equinos
const COLS_EQUINO = (actionLinksFn) => [
  { key: "numero", label: "Animal", render: (i) => <span className="font-medium">#{i.numero}{i.nombre ? ` · ${i.nombre}` : ""}</span> },
  { key: "tipo", label: "Tipo", render: (i) => <span className="capitalize">{i.tipo || "—"}</span> },
  { key: "estadoReproductivo", label: "Estado reprod.", render: (i) => <span className="capitalize">{i.estadoReproductivo}</span> },
  { key: "ultimaInseminacion", label: "Última insem./transf." },
  { key: "prenezConfirmada", label: "Preñez" },
  { key: "fechaProbableParto", label: "Fecha probable parto" },
  { key: "repeticiones", label: "Repeticiones" },
  { key: "motivo", label: "Motivo revisión" },
  { key: "accion", label: "Acción", render: (i) => <AccionCell item={i} actionLinks={actionLinksFn ? actionLinksFn(i) : []} /> },
];

function BovinosRepro({ animals, eventos, fincas, lotes, today }) {
  const data = useMemo(() => {
    const hembras = animals.filter(a => a.sexo === "hembra" && a.estado === "activo");
    const terneros = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "activo");
    const ternerosMuertos = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "muerto");

    const hembrasConRepro = hembras.map(h => {
      const reproEventos = getReproEventos(h.id, eventos);
      const daysOpenInfo = computeDaysOpenEventos(reproEventos, today);
      const isPreñada = reproEventos.some(ev => ev.subtipo === "confirmacion_preñez" || ev.subtipo === "confirmacion_prenez");
      const lastPartoEv = reproEventos.find(ev => ev.subtipo === "parto");
      const lastInsemEv = reproEventos.find(ev => ["inseminacion", "monta_natural", "servicio"].includes(ev.subtipo));
      const motivo = isPreñada ? "Preñez confirmada" : getReviewReasonEventos(reproEventos, daysOpenInfo, 90);
      const estadoRepro = isPreñada ? "preñada" : "vacia";
      const accionSugerida = isPreñada ? "Monitorear y registrar parto" : (estadoRepro === "vacia" ? "Inseminar o evaluar" : "Confirmar preñez");
      const baseItem = buildAnimalItem(h, fincas, lotes, "bovino", {
        estadoReproductivo: estadoRepro,
        motivo,
        fechaRelevante: daysOpenInfo.fechaBase,
        fechaLabel: daysOpenInfo.fechaLabel,
        diasTranscurridos: daysOpenInfo.days,
        diasLabel: daysOpenInfo.label,
        accionSugerida,
        ultimoParto: lastPartoEv ? fmtDate(lastPartoEv.fecha) : "—",
        ultimaInseminacion: lastInsemEv ? fmtDate(lastInsemEv.fecha) : "—",
        prenezConfirmada: isPreñada ? "Sí" : "No",
        fechaProbableParto: "—",
      });
      return { ...baseItem, _isPreñada: isPreñada, _reproEventos: reproEventos, _daysOpenInfo: daysOpenInfo };
    });

    const preñadas = hembrasConRepro.filter(h => h._isPreñada);
    const vacias = hembrasConRepro.filter(h => !h._isPreñada);
    const porRevisar = vacias;

    const partosProx = eventos
      .filter(ev => ev.especie === "bovino" && ev.tipo_evento === "reproduccion" && ev.subtipo === "parto" && ev.fecha >= today && ev.estado === "pendiente")
      .map(ev => {
        const animal = animals.find(a => a.id === ev.animal_id);
        const finca = fincas.find(f => f.id === animal?.finca_id);
        const lote = lotes.find(l => l.id === animal?.lote_id);
        const dias = daysBetween(today, ev.fecha);
        return {
          id: ev.id, numero: animal?.numero || "—", nombre: animal?.nombre || "", especie: "bovino",
          finca: finca?.nombre || "—", lote: lote?.nombre || "—",
          estadoReproductivo: "preñada", motivo: "Parto próximo programado",
          fechaRelevante: ev.fecha, fechaLabel: `Parto programado: ${fmtDate(ev.fecha)}`,
          diasTranscurridos: dias, diasLabel: `Faltan ${dias} días`,
          accionSugerida: "Preparar parto", link: animal ? `/animales/${animal.id}` : null,
        };
      });

    const destetesProx = eventos
      .filter(ev => ev.especie === "bovino" && ev.tipo_evento === "reproduccion" && ev.subtipo === "destete" && ev.fecha >= today && ev.estado === "pendiente")
      .map(ev => {
        const animal = animals.find(a => a.id === ev.animal_id);
        const finca = fincas.find(f => f.id === animal?.finca_id);
        const lote = lotes.find(l => l.id === animal?.lote_id);
        const dias = daysBetween(today, ev.fecha);
        return {
          id: ev.id, numero: animal?.numero || "—", nombre: animal?.nombre || "", especie: "bovino",
          finca: finca?.nombre || "—", lote: lote?.nombre || "—",
          estadoReproductivo: "—", motivo: "Destete próximo",
          fechaRelevante: ev.fecha, fechaLabel: `Destete programado: ${fmtDate(ev.fecha)}`,
          diasTranscurridos: dias, diasLabel: `Faltan ${dias} días`,
          accionSugerida: "Programar destete", link: animal ? `/animales/${animal.id}` : null,
        };
      });

    const ternerosItems = terneros.map(t => {
      const finca = fincas.find(f => f.id === t.finca_id);
      const lote = lotes.find(l => l.id === t.lote_id);
      return buildAnimalItem(t, fincas, lotes, "bovino", {
        estadoReproductivo: "ternero", motivo: "Nacido este año",
        fechaRelevante: t.fecha_nacimiento, fechaLabel: `Nacimiento: ${fmtDate(t.fecha_nacimiento)}`,
        diasTranscurridos: daysBetween(t.fecha_nacimiento, today),
        diasLabel: `${daysBetween(t.fecha_nacimiento, today)} días de edad`,
        accionSugerida: "Registrar peso y seguimiento",
      });
    });

    const ternerosMuertosItems = ternerosMuertos.map(t => {
      const finca = fincas.find(f => f.id === t.finca_id);
      return buildAnimalItem(t, fincas, lotes, "bovino", {
        estadoReproductivo: "muerto", motivo: "Mortalidad neonatal/ternero",
        fechaRelevante: t.fecha_nacimiento, fechaLabel: `Nacimiento: ${fmtDate(t.fecha_nacimiento)}`,
        accionSugerida: "Registrar causa de mortalidad",
      });
    });

    const daysOpenValues = hembrasConRepro.filter(h => h._daysOpenInfo.days !== null).map(h => h._daysOpenInfo.days);
    const avgDaysOpen = daysOpenValues.length > 0 ? Math.round(daysOpenValues.reduce((s, d) => s + d, 0) / daysOpenValues.length) : null;

    const tasaPreñez = hembras.length > 0 ? Math.round((preñadas.length / hembras.length) * 100) : 0;

    const actionLinksFn = (item) => {
      const links = [];
      if (item.estadoReproductivo === "vacia") links.push({ label: "Registrar servicio", to: "/reproduccion", variant: "ghost" });
      if (item.ultimaInseminacion !== "—" && item.prenezConfirmada === "No") links.push({ label: "Confirmar preñez", to: "/reproduccion", variant: "ghost" });
      if (item.estadoReproductivo === "preñada") links.push({ label: "Registrar parto", to: "/reproduccion", variant: "ghost" });
      return links;
    };

    const cards = [
      { key: "hembras_repro", icon: Users, label: "Hembras reproductivas", value: hembras.length, sub: "Activas", color: "emerald", items: hembrasConRepro },
      { key: "hembras_preñadas", icon: Heart, label: "Hembras preñadas", value: preñadas.length, sub: `Tasa preñez: ${tasaPreñez}%`, color: "purple", tooltip: TOOLTIPS.tasaPreñez, items: preñadas, detailSubtitle: "Hembras con preñez confirmada." },
      { key: "hembras_vacias", icon: AlertCircle, label: "Hembras vacías", value: vacias.length, sub: "Sin preñez confirmada", color: "amber", items: vacias, detailSubtitle: "Hembras sin preñez confirmada. Requieren servicio o evaluación reproductiva." },
      { key: "dias_abiertos", icon: Activity, label: "Días abiertos prom.", value: avgDaysOpen ?? "Sin datos", sub: avgDaysOpen ? `${daysOpenValues.length} hembras con datos` : "Sin partos registrados", color: "gray", tooltip: TOOLTIPS.diasAbiertos, items: hembrasConRepro.filter(h => h._daysOpenInfo.days !== null), detailSubtitle: "Días abiertos por hembra. Indica tiempo improductivo." },
      { key: "partos_prox", icon: Baby, label: "Partos próximos", value: partosProx.length, sub: "Próximos eventos", color: "blue", items: partosProx, detailSubtitle: "Partos programados pendientes." },
      { key: "destetes_prox", icon: Baby, label: "Destetes próximos", value: destetesProx.length, sub: "Próximos eventos", color: "amber", items: destetesProx, detailSubtitle: "Destetes programados pendientes." },
      { key: "terneros_nacidos", icon: Baby, label: "Terneros nacidos", value: terneros.length, sub: "Este año", color: "emerald", items: ternerosItems },
      { key: "terneros_muertos", icon: AlertTriangle, label: "Terneros muertos", value: ternerosMuertos.length, sub: "Este año", color: "red", items: ternerosMuertosItems },
      { key: "hembras_revisar", icon: AlertCircle, label: "Hembras por revisar", value: porRevisar.length, sub: porRevisar.length > 0 ? "Requieren atención" : "Sin pendientes", color: "amber", items: porRevisar, detailSubtitle: "Animales con preñez pendiente, días abiertos altos o falta de seguimiento reproductivo." },
    ];

    const allItems = hembrasConRepro;
    const columns = COLS_BOV_OVI(actionLinksFn);

    return { cards, allItems, columns };
  }, [animals, eventos, fincas, lotes, today]);

  return <ReproInteractivo cards={data.cards} allItems={data.allItems} columns={data.columns} especieLabel="Bovinos" />;
}

function OvinosRepro({ animals, eventos, fincas, lotes, today }) {
  const data = useMemo(() => {
    const ovejas = animals.filter(a => a.sexo === "hembra" && a.estado === "activo");
    const corderos = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "activo");
    const corderosMuertos = animals.filter(a => a.fecha_nacimiento && new Date(a.fecha_nacimiento) > new Date("2026-01-01") && a.estado === "muerto");

    const ovejasConRepro = ovejas.map(h => {
      const reproEventos = getReproEventos(h.id, eventos);
      const daysOpenInfo = computeDaysOpenEventos(reproEventos, today);
      const isPreñada = reproEventos.some(ev => ev.subtipo === "confirmacion_preñez" || ev.subtipo === "confirmacion_prenez");
      const lastPartoEv = reproEventos.find(ev => ev.subtipo === "parto");
      const lastInsemEv = reproEventos.find(ev => ["inseminacion", "monta_natural", "servicio"].includes(ev.subtipo));
      const motivo = isPreñada ? "Preñez confirmada" : getReviewReasonEventos(reproEventos, daysOpenInfo, 90);
      const estadoRepro = isPreñada ? "preñada" : "vacia";
      const accionSugerida = isPreñada ? "Monitorear y registrar parto" : "Servir o evaluar";
      return {
        ...buildAnimalItem(h, fincas, lotes, "ovino", {
          estadoReproductivo: estadoRepro,
          motivo, fechaRelevante: daysOpenInfo.fechaBase, fechaLabel: daysOpenInfo.fechaLabel,
          diasTranscurridos: daysOpenInfo.days, diasLabel: daysOpenInfo.label, accionSugerida,
          ultimoParto: lastPartoEv ? fmtDate(lastPartoEv.fecha) : "—",
          ultimaInseminacion: lastInsemEv ? fmtDate(lastInsemEv.fecha) : "—",
          prenezConfirmada: isPreñada ? "Sí" : "No", fechaProbableParto: "—",
        }),
        _isPreñada: isPreñada, _daysOpenInfo: daysOpenInfo,
      };
    });

    const preñadas = ovejasConRepro.filter(h => h._isPreñada);
    const vacias = ovejasConRepro.filter(h => !h._isPreñada);
    const porRevisar = vacias;
    const tasaPreñez = ovejas.length > 0 ? Math.round((preñadas.length / ovejas.length) * 100) : 0;
    const prolificidad = corderos.length > 0 && preñadas.length > 0 ? (corderos.length / preñadas.length).toFixed(1) : null;
    const mortalidad = (corderos.length + corderosMuertos.length) > 0 ? Math.round((corderosMuertos.length / (corderos.length + corderosMuertos.length)) * 100) : 0;

    const daysOpenValues = ovejasConRepro.filter(h => h._daysOpenInfo.days !== null).map(h => h._daysOpenInfo.days);
    const avgDaysOpen = daysOpenValues.length > 0 ? Math.round(daysOpenValues.reduce((s, d) => s + d, 0) / daysOpenValues.length) : null;

    const corderosItems = corderos.map(c => buildAnimalItem(c, fincas, lotes, "ovino", {
      estadoReproductivo: "cordero", motivo: "Nacido este año",
      fechaRelevante: c.fecha_nacimiento, fechaLabel: `Nacimiento: ${fmtDate(c.fecha_nacimiento)}`,
      diasTranscurridos: daysBetween(c.fecha_nacimiento, today), diasLabel: `${daysBetween(c.fecha_nacimiento, today)} días de edad`,
      accionSugerida: "Registrar peso y seguimiento",
    }));

    const corderosMuertosItems = corderosMuertos.map(c => buildAnimalItem(c, fincas, lotes, "ovino", {
      estadoReproductivo: "muerto", motivo: "Mortalidad de cordero",
      fechaRelevante: c.fecha_nacimiento, fechaLabel: `Nacimiento: ${fmtDate(c.fecha_nacimiento)}`,
      accionSugerida: "Registrar causa de mortalidad",
    }));

    const actionLinksFn = (item) => {
      const links = [];
      if (item.estadoReproductivo === "vacia") links.push({ label: "Registrar monta", to: "/reproduccion", variant: "ghost" });
      if (item.ultimaInseminacion !== "—" && item.prenezConfirmada === "No") links.push({ label: "Confirmar preñez", to: "/reproduccion", variant: "ghost" });
      if (item.estadoReproductivo === "preñada") links.push({ label: "Registrar parto", to: "/reproduccion", variant: "ghost" });
      return links;
    };

    const cards = [
      { key: "ovejas_repro", icon: Users, label: "Ovejas reproductoras", value: ovejas.length, sub: "Activas", color: "emerald", items: ovejasConRepro },
      { key: "ovejas_preñadas", icon: Heart, label: "Ovejas preñadas", value: preñadas.length, sub: `Tasa: ${tasaPreñez}%`, color: "purple", tooltip: TOOLTIPS.tasaPreñez, items: preñadas, detailSubtitle: "Ovejas con preñez confirmada." },
      { key: "ovejas_vacias", icon: AlertCircle, label: "Ovejas vacías", value: vacias.length, sub: "Sin preñez", color: "amber", items: vacias, detailSubtitle: "Ovejas sin preñez confirmada. Requieren monta o evaluación reproductiva." },
      { key: "dias_abiertos", icon: Activity, label: "Días abiertos prom.", value: avgDaysOpen ?? "Sin datos", sub: avgDaysOpen ? `${daysOpenValues.length} ovejas con datos` : "Sin partos registrados", color: "gray", tooltip: TOOLTIPS.diasAbiertos, items: ovejasConRepro.filter(h => h._daysOpenInfo.days !== null), detailSubtitle: "Días abiertos por oveja. Indica tiempo improductivo." },
      { key: "prolificidad", icon: TrendingUp, label: "Prolificidad prom.", value: prolificidad ?? "Sin datos", sub: "Corderos/parto", color: "blue", tooltip: TOOLTIPS.prolificidad, items: [], detailSubtitle: TOOLTIPS.prolificidad },
      { key: "mortalidad", icon: AlertTriangle, label: "Mortalidad corderos", value: `${mortalidad}%`, sub: `${corderosMuertos.length} muertos`, color: "red", tooltip: TOOLTIPS.mortalidad, items: corderosMuertosItems },
      { key: "corderos_nacidos", icon: Baby, label: "Corderos nacidos", value: corderos.length, sub: "Este año", color: "emerald", items: corderosItems },
      { key: "corderos_muertos", icon: AlertTriangle, label: "Corderos muertos", value: corderosMuertos.length, sub: "Este año", color: "red", items: corderosMuertosItems },
      { key: "ovejas_revisar", icon: AlertCircle, label: "Ovejas por revisar", value: porRevisar.length, sub: porRevisar.length > 0 ? "Requieren atención" : "Sin pendientes", color: "amber", items: porRevisar, detailSubtitle: "Animales con preñez pendiente, días abiertos altos o falta de seguimiento reproductivo." },
    ];

    return { cards, allItems: ovejasConRepro, columns: COLS_BOV_OVI(actionLinksFn) };
  }, [animals, eventos, fincas, lotes, today]);

  return <ReproInteractivo cards={data.cards} allItems={data.allItems} columns={data.columns} especieLabel="Ovinos" />;
}

function EquinosRepro({ yeguas, inseminaciones, confirmaciones, partos, colectas, despachos, inconformidades, reproductores, fincas, lotes, today }) {
  const data = useMemo(() => {
    const yeguasActivas = yeguas.filter(y => y.estado_reproductivo !== "retirada");
    const preñadas = yeguas.filter(y => y.estado_reproductivo === "preñada");
    const receptoras = yeguasActivas.filter(y => esReceptora(y) || y.estado_reproductivo === "vacia");
    const receptorasPreñadas = receptoras.filter(y => y.estado_reproductivo === "preñada" || y.estado_reproductivo === "inseminada");
    const receptorasVacias = receptoras.filter(y => y.estado_reproductivo === "vacia");
    const transferencias = inseminaciones.filter(i => i.tipo === "transferencia_embriones" || i.tipo_servicio === "transferencia_embriones");
    const preñecesConfirmadas = confirmaciones.length;
    const tasaExito = inseminaciones.length > 0 ? Math.round((preñecesConfirmadas / inseminaciones.length) * 100) : 0;
    const partosProx = yeguas.filter(y => y.fecha_probable_parto && y.fecha_probable_parto >= today);
    const inconformidadesAbiertas = inconformidades.filter(i => i.estado === "abierta");
    const repeticionesTotal = yeguas.reduce((s, y) => s + (y.repeticiones_celo || 0), 0);

    const buildYeguaItem = (y, extra = {}) => {
      const finca = fincas.find(f => f.id === y.finca_id);
      const lote = lotes.find(l => l.id === y.lote_id);
      const yInsems = inseminaciones.filter(i => i.yegua_id === y.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const yConfirma = confirmaciones.filter(c => c.yegua_id === y.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const yPartos = partos.filter(p => p.yegua_id === y.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const daysOpenInfo = computeDaysOpenYegua(y, inseminaciones, partos, today);
      const motivo = extra.motivo || getReviewReasonYegua(y, inseminaciones, confirmaciones, partos, daysOpenInfo, inconformidades);
      const accionSugerida = extra.accionSugerida || (y.estado_reproductivo === "vacia" ? "Inseminar o transferir" : y.estado_reproductivo === "inseminada" ? "Confirmar preñez" : y.estado_reproductivo === "preñada" ? "Monitorear parto" : "Seguimiento");
      return {
        id: y.id, numero: y.numero || y.nombre || "—", nombre: y.nombre || "", especie: "equino",
        finca: finca?.nombre || "—", lote: lote?.nombre || "—",
        estadoReproductivo: y.estado_reproductivo || "—",
        tipo: esReceptora(y) ? "receptora" : "yegua",
        motivo, fechaRelevante: daysOpenInfo.fechaBase, fechaLabel: daysOpenInfo.fechaLabel,
        diasTranscurridos: daysOpenInfo.days, diasLabel: daysOpenInfo.label,
        accionSugerida,
        ultimaInseminacion: yInsems.length > 0 ? fmtDate(yInsems[0].fecha) : (y.fecha_ultima_inseminacion ? fmtDate(y.fecha_ultima_inseminacion) : "—"),
        prenezConfirmada: yConfirma.length > 0 || y.estado_reproductivo === "preñada" ? "Sí" : "No",
        fechaProbableParto: y.fecha_probable_parto ? fmtDate(y.fecha_probable_parto) : "—",
        repeticiones: y.repeticiones_celo || 0,
        link: `/caballos/yeguas/${y.id}`,
      };
    };

    const yeguasActivasItems = yeguasActivas.map(y => buildYeguaItem(y));
    const preñadasItems = preñadas.map(y => buildYeguaItem(y, { motivo: "Preñez confirmada", accionSugerida: "Monitorear y registrar parto" }));
    const receptorasItems = receptoras.map(y => buildYeguaItem(y));
    const receptorasPreñadasItems = receptorasPreñadas.map(y => buildYeguaItem(y, { motivo: "Receptora preñada", accionSugerida: "Monitorear preñez" }));
    const receptorasVaciasItems = receptorasVacias.map(y => buildYeguaItem(y, { motivo: "Receptora vacía", accionSugerida: "Transferir embriones" }));
    const porRevisar = yeguasActivas.filter(y => {
      const item = buildYeguaItem(y);
      return y.estado_reproductivo === "vacia" || y.estado_reproductivo === "inseminada" || (y.repeticiones_celo || 0) > 0;
    }).map(y => buildYeguaItem(y));

    const repeticionesItems = yeguas.filter(y => (y.repeticiones_celo || 0) > 0).map(y => buildYeguaItem(y, { motivo: "Repeticiones de celo registradas", accionSugerida: "Evaluar causa de repetición" }));

    const transferenciasItems = transferencias.map(t => {
      const yegua = yeguas.find(y => y.id === t.yegua_id);
      const finca = fincas.find(f => f.id === yegua?.finca_id);
      return {
        id: t.id, numero: yegua?.numero || yegua?.nombre || "—", nombre: yegua?.nombre || "", especie: "equino",
        finca: finca?.nombre || "—", lote: "—",
        estadoReproductivo: yegua?.estado_reproductivo || "—", tipo: "transferencia",
        motivo: t.resultado === "pendiente" ? "Transferencia sin resultado" : `Transferencia: ${t.resultado || "pendiente"}`,
        fechaRelevante: t.fecha, fechaLabel: `Transferencia: ${fmtDate(t.fecha)}`,
        diasTranscurridos: daysBetween(t.fecha, today), diasLabel: `Hace ${daysBetween(t.fecha, today)} días`,
        accionSugerida: t.resultado === "pendiente" ? "Confirmar preñez" : "Seguimiento",
        ultimaInseminacion: fmtDate(t.fecha), prenezConfirmada: t.resultado === "preñada" ? "Sí" : "No",
        fechaProbableParto: "—", repeticiones: 0,
        link: yegua ? `/caballos/yeguas/${yegua.id}` : null,
      };
    });

    const confirmacionesItems = confirmaciones.map(c => {
      const yegua = yeguas.find(y => y.id === c.yegua_id);
      const finca = fincas.find(f => f.id === yegua?.finca_id);
      return {
        id: c.id, numero: yegua?.numero || yegua?.nombre || "—", nombre: yegua?.nombre || "", especie: "equino",
        finca: finca?.nombre || "—", lote: "—",
        estadoReproductivo: "preñada", tipo: "confirmación",
        motivo: "Preñez confirmada", fechaRelevante: c.fecha, fechaLabel: `Confirmación: ${fmtDate(c.fecha)}`,
        diasTranscurridos: daysBetween(c.fecha, today), diasLabel: `Hace ${daysBetween(c.fecha, today)} días`,
        accionSugerida: "Monitorear y registrar parto",
        ultimaInseminacion: c.fecha_inseminacion ? fmtDate(c.fecha_inseminacion) : "—",
        prenezConfirmada: "Sí", fechaProbableParto: c.fecha_probable_parto ? fmtDate(c.fecha_probable_parto) : "—",
        repeticiones: 0, link: yegua ? `/caballos/yeguas/${yegua.id}` : null,
      };
    });

    const partosProxItems = partosProx.map(y => buildYeguaItem(y, { motivo: "Parto próximo", accionSugerida: "Preparar parto" }));

    const inconformidadesItems = inconformidadesAbiertas.map(inc => {
      const reproductor = reproductores.find(r => r.id === inc.reproductor_id);
      return {
        id: inc.id, numero: reproductor?.numero || "—", nombre: reproductor?.nombre || "", especie: "equino",
        finca: "—", lote: "—", estadoReproductivo: "—", tipo: "inconformidad",
        motivo: inc.tipo_novedad?.replace(/_/g, " ") || "Inconformidad",
        fechaRelevante: inc.fecha_reporte, fechaLabel: `Reporte: ${fmtDate(inc.fecha_reporte)}`,
        diasTranscurridos: daysBetween(inc.fecha_reporte, today), diasLabel: `Hace ${daysBetween(inc.fecha_reporte, today)} días`,
        accionSugerida: "Atender inconformidad", ultimaInseminacion: "—",
        prenezConfirmada: "—", fechaProbableParto: "—", repeticiones: 0,
        link: reproductor ? `/reproductores/${reproductor.id}` : null,
      };
    });

    const despachosPorReproductor = (() => {
      const map = {};
      despachos.forEach(d => {
        const name = d.reproductor || "Sin nombre";
        map[name] = (map[name] || 0) + 1;
      });
      return Object.entries(map).map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 18) + "…" : name, count }));
    })();

    const actionLinksFn = (item) => {
      const links = [];
      if (item.estadoReproductivo === "vacia") links.push({ label: "Inseminar", to: "/caballos/inseminacion/nueva", variant: "ghost" });
      if (item.prenezConfirmada === "No" && item.ultimaInseminacion !== "—") links.push({ label: "Confirmar preñez", to: "/caballos/preñez/nueva", variant: "ghost" });
      if (item.estadoReproductivo === "preñada") links.push({ label: "Registrar parto", to: "/caballos/parto/nuevo", variant: "ghost" });
      return links;
    };

    const cards = [
      { key: "yeguas_repro", icon: Users, label: "Yeguas reproductivas", value: yeguasActivas.length, sub: "Activas", color: "emerald", items: yeguasActivasItems },
      { key: "yeguas_preñadas", icon: Heart, label: "Yeguas preñadas", value: preñadas.length, sub: `Tasa: ${tasaExito}%`, color: "purple", tooltip: TOOLTIPS.tasaExito, items: preñadasItems, detailSubtitle: "Yeguas con preñez confirmada." },
      { key: "receptoras_activas", icon: Users, label: "Receptoras activas", value: receptoras.length, sub: `${receptorasPreñadas.length} preñadas`, color: "blue", items: receptorasItems, detailSubtitle: "Yeguas receptoras activas en el programa de transferencia." },
      { key: "receptoras_preñadas", icon: Heart, label: "Receptoras preñadas", value: receptorasPreñadas.length, sub: "Preñadas/inseminadas", color: "purple", items: receptorasPreñadasItems },
      { key: "receptoras_vacias", icon: AlertCircle, label: "Receptoras vacías", value: receptorasVacias.length, sub: "Disponibles", color: "amber", items: receptorasVaciasItems, detailSubtitle: "Receptoras disponibles para transferencia." },
      { key: "transferencias", icon: FlaskConical, label: "Transferencias", value: transferencias.length, sub: "Realizadas", color: "amber", items: transferenciasItems },
      { key: "confirmaciones", icon: Heart, label: "Preñeces confirmadas", value: preñecesConfirmadas, sub: "Total", color: "emerald", items: confirmacionesItems },
      { key: "repeticiones", icon: AlertTriangle, label: "Repeticiones", value: repeticionesTotal, sub: "Celos repetidos", color: "red", items: repeticionesItems, detailSubtitle: "Yeguas con repeticiones de celo registradas." },
      { key: "partos_prox", icon: Baby, label: "Partos próximos", value: partosProx.length, sub: "Próximos", color: "blue", items: partosProxItems, detailSubtitle: "Yeguas con fecha probable de parto próxima." },
      { key: "inconformidades", icon: AlertTriangle, label: "Inconformidades", value: inconformidadesAbiertas.length, sub: "Abiertas", color: "red", items: inconformidadesItems, detailSubtitle: "Inconformidades de clientes sin resolver." },
    ];

    const extraCharts = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-heading font-semibold mb-3">Despachos por reproductor</h3>
          {despachosPorReproductor.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={despachosPorReproductor} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#4a90d9" name="Despachos" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <NoData />}
        </Card>
        <Card className="p-4">
          <h3 className="font-heading font-semibold mb-3">Colectas y despachos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="text-xs text-emerald-600 font-medium">Colectas totales</p>
              <p className="text-xl font-bold text-emerald-700">{colectas.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Despachos totales</p>
              <p className="text-xl font-bold text-blue-700">{despachos.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Reproductores activos</p>
              <p className="text-xl font-bold text-purple-700">{reproductores.filter(r => r.estado === "activo").length}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium">Tasa éxito/transf.</p>
              <p className="text-xl font-bold text-amber-700">{tasaExito}%</p>
            </div>
          </div>
        </Card>
      </div>
    );

    return { cards, allItems: yeguasActivasItems, columns: COLS_EQUINO(actionLinksFn), extraCharts };
  }, [yeguas, inseminaciones, confirmaciones, partos, colectas, despachos, inconformidades, reproductores, fincas, lotes, today]);

  return (
    <ReproInteractivo cards={data.cards} allItems={data.allItems} columns={data.columns} especieLabel="Equinos">
      {data.extraCharts}
    </ReproInteractivo>
  );
}

export default function ReproduccionGenetica({
  especieFilter, animals, yeguas, inseminaciones, confirmaciones, partos,
  colectas, despachos, inconformidades, reproductores, eventos, fincas, lotes
}) {
  const today = new Date().toISOString().split("T")[0];

  if (especieFilter === "bovino") return <BovinosRepro animals={animals} eventos={eventos} fincas={fincas} lotes={lotes} today={today} />;
  if (especieFilter === "ovino") return <OvinosRepro animals={animals} eventos={eventos} fincas={fincas} lotes={lotes} today={today} />;
  if (especieFilter === "equino") return (
    <EquinosRepro
      yeguas={yeguas} inseminaciones={inseminaciones} confirmaciones={confirmaciones}
      partos={partos} colectas={colectas} despachos={despachos}
      inconformidades={inconformidades} reproductores={reproductores}
      fincas={fincas} lotes={lotes} today={today}
    />
  );

  return (
    <Card className="p-8 text-center">
      <Heart className="w-8 h-8 text-amber-500 mx-auto mb-3" />
      <h3 className="font-heading font-semibold mb-1">Selecciona una especie</h3>
      <p className="text-sm text-muted-foreground">
        Filtra por Bovinos, Ovinos o Equinos para ver los indicadores reproductivos específicos de cada especie.
      </p>
    </Card>
  );
}