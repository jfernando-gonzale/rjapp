import { daysBetween } from "@/lib/helpers";

// Motor de cálculo de costos de producción y rentabilidad para RJAPP.
// Todos los valores monetarios son pesos colombianos (enteros limpios).

// --- Distribución de gastos ---

// Gastos asignados directamente a un animal (animal_id) + distribución de gastos de lote/finca.
export function getGastosAsignadosAnimal(animal, gastos, loteAnimals, fincaAnimals) {
  const directos = gastos.filter((g) => g.animal_id === animal.id);
  const directosTotal = directos.reduce((s, g) => s + (g.valor || 0), 0);

  let loteShare = 0;
  if (animal.lote_id && loteAnimals) {
    const animalesDelLote = loteAnimals.filter((a) => a.lote_id === animal.lote_id && a.estado === "activo").length || 1;
    const gastosLote = gastos.filter((g) => g.lote_id === animal.lote_id && !g.animal_id);
    const totalLote = gastosLote.reduce((s, g) => s + (g.valor || 0), 0);
    loteShare = totalLote / animalesDelLote;
  }

  let fincaShare = 0;
  if (animal.finca_id && fincaAnimals) {
    const animalesDeFinca = fincaAnimals.filter((a) => a.finca_id === animal.finca_id && a.estado === "activo").length || 1;
    const gastosFinca = gastos.filter((g) => g.finca_id === animal.finca_id && !g.animal_id && !g.lote_id);
    const totalFinca = gastosFinca.reduce((s, g) => s + (g.valor || 0), 0);
    fincaShare = totalFinca / animalesDeFinca;
  }

  return {
    directos,
    directosTotal,
    loteShare,
    fincaShare,
    total: directosTotal + loteShare + fincaShare,
  };
}

// --- Bovinos / Ovinos de ceba ---

export function calcRentabilidadCeba(animal, gastos, tratamientos, procedimientos, ventas, loteAnimals, fincaAnimals, user) {
  const especie = animal.especie || "bovino";
  const venta = ventas && ventas.length > 0 ? ventas.find((v) => v.animal_id === animal.id) || ventas[0] : null;

  const precioCompra = animal.precio_compra || 0;
  const transporteInicial = animal.costo_transporte_inicial || 0;
  const otrosIniciales = animal.otros_costos_iniciales || 0;
  const pesoCompra = animal.peso_compra || null;

  const gastosAsig = getGastosAsignadosAnimal(animal, gastos || [], loteAnimals, fincaAnimals);
  const costoTratamientos = (tratamientos || []).filter((t) => t.animal_id === animal.id).reduce((s, t) => s + (t.costo || 0), 0);
  const costoProcedimientos = (procedimientos || []).filter((p) => p.animal_id === animal.id).reduce((s, p) => s + (p.costo || 0), 0);

  const gastosProduccion = gastosAsig.total + costoTratamientos + costoProcedimientos;
  const costoAcumulado = precioCompra + transporteInicial + otrosIniciales + gastosProduccion;

  const pesoActual = venta ? venta.peso_venta : animal.ultimo_peso;
  const kilosGanados = pesoCompra != null && pesoActual != null ? pesoActual - pesoCompra : null;

  const costoPorKgGanado = kilosGanados != null && kilosGanados > 0 ? gastosProduccion / kilosGanados : null;
  const costoPorKgProducido = pesoActual != null && pesoActual > 0 ? costoAcumulado / pesoActual : null;

  const precioVentaTotal = venta ? venta.precio_total || 0 : 0;
  const precioVentaKilo = venta ? venta.precio_kilo || 0 : 0;
  const costoTransporteVenta = venta ? venta.costo_transporte || 0 : 0;
  const comisionVenta = venta ? venta.comision || 0 : 0;
  const otrosDescuentos = venta ? venta.otros_descuentos || 0 : 0;

  const utilidad = venta ? precioVentaTotal - costoAcumulado - costoTransporteVenta - comisionVenta - otrosDescuentos : null;
  const margenPorKg = venta && pesoActual ? precioVentaKilo - (costoAcumulado / pesoActual) : null;
  const rentabilidadPct = utilidad != null && costoAcumulado > 0 ? (utilidad / costoAcumulado) * 100 : null;
  const puntoEquilibrioKg = venta && venta.peso_venta ? costoAcumulado / venta.peso_venta : pesoActual ? costoAcumulado / pesoActual : null;

  // Días en producción
  let diasProduccion = null;
  if (animal.fecha_compra) {
    const fechaFin = venta ? venta.fecha : new Date().toISOString().split("T")[0];
    diasProduccion = daysBetween(animal.fecha_compra, fechaFin);
  }

  // Utilidad proyectada si no hay venta pero hay precio estimado configurado
  const precioEstimadoVenta = getPrecioEstimadoVenta(user, especie);
  const utilidadProyectada = !venta && pesoActual != null && precioEstimadoVenta
    ? pesoActual * precioEstimadoVenta - costoAcumulado
    : null;

  return {
    especie,
    pesoCompra,
    precioCompra,
    pesoActual,
    pesoVenta: venta?.peso_venta || null,
    precioVentaTotal,
    precioVentaKilo,
    kilosGanados,
    diasProduccion,
    gastosProduccion,
    costoAcumulado,
    costoPorKgGanado,
    costoPorKgProducido,
    utilidad,
    utilidadProyectada,
    margenPorKg,
    rentabilidadPct,
    puntoEquilibrioKg,
    tieneVenta: !!venta,
    precioEstimadoVenta,
  };
}

// --- Reproducción (bovinos/ovinos) ---

export function calcRentabilidadReproductiva(animales, gastos, inseminaciones, confirmaciones, partos, especie) {
  const hembras = animales.filter((a) => (a.especie || "bovino") === especie && a.sexo === "hembra" && a.estado === "activo");
  const preñeces = confirmaciones.filter((c) => hembras.some((h) => h.id === c.yegua_id)).length;
  const partosVivos = partos.filter((p) => p.resultado === "cria_viva" && hembras.some((h) => h.id === p.yegua_id)).length;

  // Gastos reproductivos: categorías veterinario, medicina + gastos de las hembras
  const gastosRepro = gastos.filter((g) => {
    if (g.especie && g.especie !== especie && g.especie !== "general") return false;
    return ["veterinario", "medicina", "vitaminas", "vacunas", "otros"].includes(g.categoria);
  });
  const totalGastosRepro = gastosRepro.reduce((s, g) => s + (g.valor || 0), 0);

  // Gastos de las hembras reproductoras (mantenimiento)
  const hembrasIds = new Set(hembras.map((h) => h.id));
  const gastosHembras = gastos.filter((g) => hembrasIds.has(g.animal_id));
  const totalGastosHembras = gastosHembras.reduce((s, g) => s + (g.valor || 0), 0);

  const costoPorPrenez = preñeces > 0 ? totalGastosRepro / preñeces : null;
  const costoPorCriaNacida = partosVivos > 0 ? (totalGastosRepro + totalGastosHembras) / partosVivos : null;

  return {
    especie,
    hembrasReproductivas: hembras.length,
    preñeces,
    partosVivos,
    totalGastosRepro,
    totalGastosHembras,
    costoPorPrenez,
    costoPorCriaNacida,
  };
}

// --- Equinos: embriones, potros ---

export function calcRentabilidadEquinos(yeguas, inseminaciones, confirmaciones, partos, colectas, gastos) {
  const donadoras = yeguas.filter((y) => ["donadora", "donadora_receptora"].includes(y.tipo_yegua) && y.estado_reproductivo !== "retirada");
  const receptoras = yeguas.filter((y) => ["receptora", "donadora_receptora"].includes(y.tipo_yegua) && y.estado_reproductivo !== "retirada");

  const transferencias = inseminaciones.filter((i) => i.tipo === "transferencia_embriones");
  const preñecesReceptoras = confirmaciones.filter((c) => receptoras.some((r) => r.id === c.yegua_id)).length;
  const potrosNacidos = partos.filter((p) => p.resultado === "cria_viva" && receptoras.some((r) => r.id === p.yegua_id)).length;

  const donadorasIds = new Set(donadoras.map((d) => d.id));
  const receptorasIds = new Set(receptoras.map((r) => r.id));

  const gastosDonadoras = gastos.filter((g) => donadorasIds.has(g.animal_id) || (g.especie === "equino" && ["veterinario", "medicina"].includes(g.categoria)));
  const totalGastosDonadoras = gastosDonadoras.reduce((s, g) => s + (g.valor || 0), 0);
  const embrionesProducidos = transferencias.length || colectas.reduce((s, c) => s + (c.numero_dosis || 0), 0);

  const costoPorEmbrión = embrionesProducidos > 0 ? totalGastosDonadoras / embrionesProducidos : null;
  const costoPorPrenez = preñecesReceptoras > 0 ? totalGastosDonadoras / preñecesReceptoras : null;

  const gastosReceptoras = gastos.filter((g) => receptorasIds.has(g.animal_id));
  const totalGastosReceptoras = gastosReceptoras.reduce((s, g) => s + (g.valor || 0), 0);
  const costoPorPotroNacido = potrosNacidos > 0 ? (totalGastosDonadoras + totalGastosReceptoras) / potrosNacidos : null;

  return {
    donadoras: donadoras.length,
    receptoras: receptoras.length,
    transferencias: transferencias.length,
    embrionesProducidos,
    preñecesReceptoras,
    potrosNacidos,
    totalGastosDonadoras,
    totalGastosReceptoras,
    costoPorEmbrión,
    costoPorPrenez,
    costoPorPotroNacido,
  };
}

// --- Equinos: reproductores / semen ---

export function calcRentabilidadReproductor(reproductores, colectas, despachos, inconformidades, gastos) {
  return reproductores.filter((r) => r.estado === "activo").map((r) => {
    const colectasRep = colectas.filter((c) => c.reproductor_id === r.id);
    const despachosRep = despachos.filter((d) => d.reproductor_id === r.id || d.reproductor === r.nombre);
    const inconformidadesRep = inconformidades.filter((i) => i.reproductor_id === r.id);
    const dosisProducidas = colectasRep.reduce((s, c) => s + (c.numero_dosis || 0), 0);
    const dosisVendidas = despachosRep.reduce((s, d) => s + (d.numero_dosis || 0), 0);
    const ingresoTotal = despachosRep.reduce((s, d) => s + (d.valor_cobrado || 0), 0);
    const gastosRep = gastos.filter((g) => g.animal_id === r.id || (g.descripcion || "").includes(r.nombre));
    const costoTotal = gastosRep.reduce((s, g) => s + (g.valor || 0), 0);
    const utilidad = ingresoTotal - costoTotal;
    const tasaInconformidad = dosisVendidas > 0 ? (inconformidadesRep.length / dosisVendidas) * 100 : null;
    return {
      id: r.id,
      nombre: r.nombre,
      raza: r.raza,
      colectas: colectasRep.length,
      dosisProducidas,
      dosisVendidas,
      ingresoTotal,
      costoTotal,
      utilidad,
      inconformidades: inconformidadesRep.length,
      tasaInconformidad,
    };
  });
}

// --- Semáforo de rentabilidad ---

export function semaforoRentabilidad(rentabilidadPct, margenMinimo = 15) {
  if (rentabilidadPct == null || isNaN(rentabilidadPct)) {
    return { nivel: "sin_datos", label: "Sin datos", color: "gray" };
  }
  if (rentabilidadPct >= margenMinimo) {
    return { nivel: "rentable", label: "Rentable", color: "green" };
  }
  if (rentabilidadPct >= 0) {
    return { nivel: "margen_bajo", label: "Margen bajo", color: "yellow" };
  }
  return { nivel: "perdida", label: "Pérdida", color: "red" };
}

export const SEMAFORO_STYLES = {
  green: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  yellow: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", border: "border-l-amber-500" },
  red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", border: "border-l-red-500" },
  gray: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400", border: "border-l-gray-300" },
};

// --- Configuración económica por usuario ---

export const DEFAULT_MARGENES_MINIMOS = { bovino: 15, ovino: 15 };
export const DEFAULT_PRECIOS_ESTIMADOS_VENTA = { bovino: null, ovino: null };
export const DEFAULT_DISTRIBUCION_GASTOS = "por_animal";

export function getMargenesMinimos(user) {
  if (!user) return DEFAULT_MARGENES_MINIMOS;
  try {
    const raw = user.margenes_minimos;
    if (!raw) return DEFAULT_MARGENES_MINIMOS;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { bovino: parsed.bovino ?? DEFAULT_MARGENES_MINIMOS.bovino, ovino: parsed.ovino ?? DEFAULT_MARGENES_MINIMOS.ovino };
  } catch {
    return DEFAULT_MARGENES_MINIMOS;
  }
}

export function getPreciosEstimadosVenta(user) {
  if (!user) return DEFAULT_PRECIOS_ESTIMADOS_VENTA;
  try {
    const raw = user.precios_estimados_venta;
    if (!raw) return DEFAULT_PRECIOS_ESTIMADOS_VENTA;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { bovino: parsed.bovino ?? null, ovino: parsed.ovino ?? null };
  } catch {
    return DEFAULT_PRECIOS_ESTIMADOS_VENTA;
  }
}

export function getPrecioEstimadoVenta(user, especie) {
  const precios = getPreciosEstimadosVenta(user);
  return precios[especie] || null;
}

export function getDistribucionGastosDefault(user) {
  if (!user) return DEFAULT_DISTRIBUCION_GASTOS;
  return user.distribucion_gastos_default || DEFAULT_DISTRIBUCION_GASTOS;
}