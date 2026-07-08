import {
  calcRentabilidadCeba,
  getMargenesMinimos,
  getPrecioEstimadoVenta,
} from "@/lib/costosProduccion";
import { formatCurrency } from "@/lib/helpers";

// Construye alertas de rentabilidad para el Dashboard.
// severidad: "rojo" | "amarillo" | "verde" | "gris"
export function buildAlertasRentabilidad(animals, gastos, ventas, tratamientos, procedimientos, lotes, fincas, user) {
  const alerts = [];
  if (!animals || animals.length === 0) return alerts;

  const margenes = getMargenesMinimos(user);
  const activos = animals.filter((a) => a.estado === "activo" && (a.especie === "bovino" || a.especie === "ovino" || !a.especie));

  const resultados = activos.map((a) => {
    const venta = ventas.find((v) => v.animal_id === a.id);
    const res = calcRentabilidadCeba(a, gastos, tratamientos, procedimientos, venta ? [venta] : [], animals, animals, user);
    const lote = lotes.find((l) => l.id === a.lote_id);
    return { animal: a, res, venta, lote };
  });

  const conDatos = resultados.filter((r) => r.res.costoAcumulado > 0);

  // 1. Lotes con pérdida o margen bajo
  const lotesStats = lotes.map((l) => {
    const resLote = conDatos.filter((r) => r.animal.lote_id === l.id);
    if (resLote.length === 0) return null;
    const utilidad = resLote.reduce((s, r) => s + (r.res.utilidad ?? r.res.utilidadProyectada ?? 0), 0);
    const costo = resLote.reduce((s, r) => s + r.res.costoAcumulado, 0);
    const rentabilidad = costo > 0 ? (utilidad / costo) * 100 : null;
    return { lote: l, utilidad, costo, rentabilidad, count: resLote.length };
  }).filter(Boolean);

  lotesStats.forEach((s) => {
    if (s.rentabilidad == null) return;
    const esp = s.lote.especie || "bovino";
    const margenMin = margenes[esp] ?? 15;
    const precioEst = getPrecioEstimadoVenta(user, esp);
    if (s.rentabilidad < 0) {
      alerts.push({
        tipo: "lote_perdida",
        severidad: "rojo",
        titulo: `Lote ${s.lote.nombre} está en pérdida`,
        detalle: `Costo: ${formatCurrency(s.costo)} · Utilidad: ${formatCurrency(s.utilidad)}${precioEst ? ` · Precio esperado: ${formatCurrency(precioEst)}/kg` : ""}`,
        link: "/rentabilidad",
      });
    } else if (s.rentabilidad < margenMin) {
      alerts.push({
        tipo: "lote_margen_bajo",
        severidad: "amarillo",
        titulo: `Lote ${s.lote.nombre} está en margen bajo`,
        detalle: `Rentabilidad: ${s.rentabilidad.toFixed(1)}% · Margen mínimo: ${margenMin}%`,
        link: "/rentabilidad",
      });
    }
  });

  // 2. Animales: costo por kilo mayor al precio estimado de venta
  resultados.forEach((r) => {
    if (!r.res.costoAcumulado || r.res.costoAcumulado <= 0) return;
    const esp = r.animal.especie || "bovino";
    const precioEst = getPrecioEstimadoVenta(user, esp);
    if (r.res.costoPorKgProducido != null && precioEst && r.res.costoPorKgProducido > precioEst) {
      alerts.push({
        tipo: "costo_mayor_precio",
        severidad: "rojo",
        titulo: `#${r.animal.numero} tiene costo por kilo mayor al precio de venta`,
        detalle: `Costo: ${formatCurrency(r.res.costoPorKgProducido)}/kg · Precio estimado: ${formatCurrency(precioEst)}/kg`,
        link: `/animales/${r.animal.id}`,
      });
    }
    // Animal con alto costo y baja/nula ganancia
    if (r.res.kilosGanados != null && r.res.kilosGanados <= 0 && r.res.costoAcumulado > 0) {
      alerts.push({
        tipo: "alto_costo_baja_ganancia",
        severidad: "rojo",
        titulo: `#${r.animal.numero} tiene baja ganancia y alto costo acumulado`,
        detalle: `Costo acumulado: ${formatCurrency(r.res.costoAcumulado)} · Kilos ganados: ${r.res.kilosGanados.toFixed(0)} kg`,
        link: `/animales/${r.animal.id}`,
      });
    }
  });

  // 3. Finca con mayor gasto
  const totalGastos = (gastos || []).reduce((s, g) => s + (g.valor || 0), 0);
  const gastosPorFinca = (fincas || []).map((f) => {
    const total = (gastos || []).filter((g) => g.finca_id === f.id).reduce((s, g) => s + (g.valor || 0), 0);
    return { finca: f, total };
  }).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);

  if (gastosPorFinca.length > 0 && totalGastos > 0) {
    const top = gastosPorFinca[0];
    const pct = (top.total / totalGastos) * 100;
    if (pct > 30) {
      alerts.push({
        tipo: "finca_mayor_gasto",
        severidad: "amarillo",
        titulo: `Finca ${top.finca.nombre} concentra el mayor gasto del periodo`,
        detalle: `Total: ${formatCurrency(top.total)} (${pct.toFixed(0)}% del total)`,
        link: "/rentabilidad",
      });
    }
  }

  // 4. Gastos que impactan fuerte la rentabilidad (top categoría)
  const gastosPorCat = {};
  (gastos || []).forEach((g) => {
    const cat = g.categoria || "otros";
    gastosPorCat[cat] = (gastosPorCat[cat] || 0) + (g.valor || 0);
  });
  const topCats = Object.entries(gastosPorCat).sort((a, b) => b[1] - a[1]);
  if (topCats.length > 0 && totalGastos > 0) {
    const [cat, total] = topCats[0];
    const pct = (total / totalGastos) * 100;
    if (pct > 25) {
      alerts.push({
        tipo: "gasto_impacto",
        severidad: "amarillo",
        titulo: `Gastos de ${cat.replace(/_/g, " ")} impactan fuerte la rentabilidad`,
        detalle: `Total: ${formatCurrency(total)} (${pct.toFixed(0)}% del total de gastos)`,
        link: "/rentabilidad",
      });
    }
  }

  // 5. Animales que superaron punto de equilibrio (utilidad proyectada positiva)
  const sobreEquilibrio = resultados.filter((r) => r.res.utilidadProyectada != null && r.res.utilidadProyectada > 0 && !r.res.tieneVenta);
  if (sobreEquilibrio.length > 0) {
    alerts.push({
      tipo: "sobre_equilibrio",
      severidad: "verde",
      titulo: `${sobreEquilibrio.length} animal${sobreEquilibrio.length > 1 ? "es" : ""} super${sobreEquilibrio.length > 1 ? "aron" : "ó"} el punto de equilibrio`,
      detalle: "Venta proyectada con utilidad positiva al precio estimado",
      link: "/rentabilidad",
    });
  }

  // Sin datos suficientes
  if (alerts.length === 0 && conDatos.length === 0 && activos.length > 0) {
    alerts.push({
      tipo: "sin_datos",
      severidad: "gris",
      titulo: "Sin datos suficientes para alertas de rentabilidad",
      detalle: "Registra pesos, gastos y precios estimados para ver el análisis económico",
      link: "/rentabilidad",
    });
  }

  return alerts;
}