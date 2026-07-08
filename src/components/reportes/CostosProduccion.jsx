import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/helpers";
import {
  calcRentabilidadCeba,
  calcRentabilidadReproductiva,
  calcRentabilidadEquinos,
  calcRentabilidadReproductor,
  semaforoRentabilidad,
  getMargenesMinimos,
} from "@/lib/costosProduccion";
import SemaforoRentabilidad from "@/components/shared/SemaforoRentabilidad";
import { TrendingUp, Scale, Target, PiggyBank } from "lucide-react";

function IndicadorCard({ titulo, valor, subtitulo, icon: Icon, color = "primary" }) {
  const colors = {
    primary: "text-amber-600",
    blue: "text-blue-600",
    green: "text-emerald-600",
    red: "text-red-600",
    gray: "text-gray-500",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{titulo}</p>
        {Icon ? <Icon className={`w-4 h-4 ${colors[color]}`} /> : null}
      </div>
      <p className={`text-lg font-heading font-bold ${colors[color]}`}>{valor}</p>
      {subtitulo && <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>}
    </Card>
  );
}

// --- Bovinos / Ovinos de ceba ---
function AnalisisCeba({ animals, gastos, ventas, tratamientos, procedimientos, lotes, user, especie }) {
  const animalesCeba = animals.filter((a) => (a.especie || "bovino") === especie && a.estado === "activo");
  const margenes = getMargenesMinimos(user);
  const margenMinimo = margenes[especie] ?? 15;

  const resultados = useMemo(() => animalesCeba.map((a) => {
    const venta = ventas.find((v) => v.animal_id === a.id);
    const res = calcRentabilidadCeba(a, gastos, tratamientos, procedimientos, venta ? [venta] : [], animals, animals, user);
    return { animal: a, res, venta };
  }), [animalesCeba, gastos, ventas, tratamientos, procedimientos, user]);

  const conDatos = resultados.filter((r) => r.res.costoAcumulado > 0);

  const conKgProducido = conDatos.filter((r) => r.res.costoPorKgProducido != null);
  const promCostoKgProducido = conKgProducido.length > 0 ? conKgProducido.reduce((s, r) => s + r.res.costoPorKgProducido, 0) / conKgProducido.length : null;

  const conKgGanado = conDatos.filter((r) => r.res.costoPorKgGanado != null);
  const promCostoKgGanado = conKgGanado.length > 0 ? conKgGanado.reduce((s, r) => s + r.res.costoPorKgGanado, 0) / conKgGanado.length : null;

  const conUtilidad = conDatos.filter((r) => r.res.utilidad != null);
  const promUtilidad = conUtilidad.length > 0 ? conUtilidad.reduce((s, r) => s + r.res.utilidad, 0) / conUtilidad.length : null;
  const promRentabilidad = conUtilidad.length > 0 ? conUtilidad.reduce((s, r) => s + (r.res.rentabilidadPct || 0), 0) / conUtilidad.length : null;

  const porLote = useMemo(() => {
    return lotes.map((l) => {
      const resLote = conDatos.filter((r) => r.animal.lote_id === l.id);
      if (resLote.length === 0) return null;
      const utilidad = resLote.reduce((s, r) => s + (r.res.utilidad || r.res.utilidadProyectada || 0), 0);
      const costo = resLote.reduce((s, r) => s + r.res.costoAcumulado, 0);
      const rentabilidad = costo > 0 ? (utilidad / costo) * 100 : null;
      return { name: l.nombre, utilidad, costoAcumulado: costo, count: resLote.length, rentabilidad };
    }).filter(Boolean);
  }, [lotes, conDatos]);

  const ranking = useMemo(() => [...conDatos].sort((a, b) => b.res.costoAcumulado - a.res.costoAcumulado).slice(0, 8), [conDatos]);

  if (animalesCeba.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No hay {especie === "bovino" ? "bovinos" : "ovinos"} activos registrados.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <IndicadorCard titulo="Costo/kg producido prom." valor={promCostoKgProducido != null ? `${formatCurrency(promCostoKgProducido)}/kg` : "—"} subtitulo={`${conDatos.length} animales con datos`} icon={Scale} color="primary" />
        <IndicadorCard titulo="Costo/kg ganado prom." valor={promCostoKgGanado != null ? `${formatCurrency(promCostoKgGanado)}/kg` : "—"} subtitulo="Gastos de producción" icon={TrendingUp} color="blue" />
        <IndicadorCard titulo="Utilidad prom. (vendidos)" valor={promUtilidad != null ? formatCurrency(promUtilidad) : "—"} subtitulo={`${conUtilidad.length} vendidos`} icon={PiggyBank} color={promUtilidad != null && promUtilidad >= 0 ? "green" : "red"} />
        <IndicadorCard titulo="Rentabilidad prom." valor={promRentabilidad != null ? `${promRentabilidad.toFixed(1)}%` : "—"} subtitulo={`Margen mínimo: ${margenMinimo}%`} icon={Target} color={promRentabilidad != null ? (promRentabilidad >= margenMinimo ? "green" : promRentabilidad >= 0 ? "primary" : "red") : "gray"} />
      </div>

      {porLote.length > 0 && (
        <Card className="!p-4">
          <h3 className="font-heading font-semibold mb-3">Rentabilidad por lote</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Lote</th>
                  <th className="text-right p-2 font-medium">Animales</th>
                  <th className="text-right p-2 font-medium">Costo acumulado</th>
                  <th className="text-right p-2 font-medium">Utilidad</th>
                  <th className="text-right p-2 font-medium">Rentab.</th>
                  <th className="text-center p-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {porLote.map((l, i) => {
                  const sem = semaforoRentabilidad(l.rentabilidad, margenMinimo);
                  return (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">{l.name}</td>
                      <td className="p-2 text-right">{l.count}</td>
                      <td className="p-2 text-right">{formatCurrency(l.costoAcumulado)}</td>
                      <td className={`p-2 text-right font-medium ${l.utilidad >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(l.utilidad)}</td>
                      <td className="p-2 text-right">{l.rentabilidad != null ? `${l.rentabilidad.toFixed(1)}%` : "—"}</td>
                      <td className="p-2 text-center"><SemaforoRentabilidad nivel={sem.color} label={sem.label} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {ranking.length > 0 && (
        <Card className="!p-4">
          <h3 className="font-heading font-semibold mb-3">Animales con mayor costo acumulado</h3>
          <div className="space-y-2">
            {ranking.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">#{r.animal.numero || "—"}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{r.res.kilosGanados != null ? `+${r.res.kilosGanados.toFixed(0)} kg` : "—"}</span>
                  <span className="font-medium">{formatCurrency(r.res.costoAcumulado)}</span>
                  {r.res.costoPorKgProducido != null && <span className="text-xs text-muted-foreground">{formatCurrency(r.res.costoPorKgProducido)}/kg</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// --- Reproducción bovinos/ovinos ---
function AnalisisReproductivo({ animals, gastos, inseminaciones, confirmaciones, partos, especie }) {
  const res = calcRentabilidadReproductiva(animals, gastos, inseminaciones, confirmaciones, partos, especie);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <IndicadorCard titulo="Hembras reproductivas" valor={res.hembrasReproductivas} icon={PiggyBank} color="blue" />
      <IndicadorCard titulo="Preñeces confirmadas" valor={res.preñeces} icon={Target} color="primary" />
      <IndicadorCard titulo="Costo por preñez" valor={res.costoPorPrenez != null ? formatCurrency(res.costoPorPrenez) : "Sin datos"} subtitulo={res.preñeces === 0 ? "Falta registrar preñeces" : ""} icon={Scale} color="green" />
      <IndicadorCard titulo="Costo por cría nacida" valor={res.costoPorCriaNacida != null ? formatCurrency(res.costoPorCriaNacida) : "Sin datos"} subtitulo={res.partosVivos === 0 ? "Falta registrar partos" : ""} icon={TrendingUp} color="primary" />
    </div>
  );
}

// --- Equinos ---
function AnalisisEquinos({ yeguas, inseminaciones, confirmaciones, partos, colectas, gastos, reproductores, despachos, inconformidades }) {
  const resEq = calcRentabilidadEquinos(yeguas, inseminaciones, confirmaciones, partos, colectas, gastos);
  const resRep = calcRentabilidadReproductor(reproductores, colectas, despachos, inconformidades, gastos);
  const topReproductores = [...resRep].sort((a, b) => (b.utilidad || 0) - (a.utilidad || 0)).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <IndicadorCard titulo="Costo por embrión" valor={resEq.costoPorEmbrión != null ? formatCurrency(resEq.costoPorEmbrión) : "Sin datos"} subtitulo={`${resEq.embrionesProducidos} producidos`} icon={Scale} color="primary" />
        <IndicadorCard titulo="Costo por preñez" valor={resEq.costoPorPrenez != null ? formatCurrency(resEq.costoPorPrenez) : "Sin datos"} subtitulo={`${resEq.preñecesReceptoras} confirmadas`} icon={Target} color="green" />
        <IndicadorCard titulo="Costo por potro nacido" valor={resEq.costoPorPotroNacido != null ? formatCurrency(resEq.costoPorPotroNacido) : "Sin datos"} subtitulo={`${resEq.potrosNacidos} nacidos`} icon={PiggyBank} color="blue" />
        <IndicadorCard titulo="Donadoras / Receptoras" valor={`${resEq.donadoras} / ${resEq.receptoras}`} icon={TrendingUp} color="gray" />
      </div>

      {topReproductores.length > 0 && (
        <Card className="!p-4">
          <h3 className="font-heading font-semibold mb-3">Rentabilidad por reproductor</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Reproductor</th>
                  <th className="text-right p-2 font-medium">Dosis vendidas</th>
                  <th className="text-right p-2 font-medium">Ingresos</th>
                  <th className="text-right p-2 font-medium">Costos</th>
                  <th className="text-right p-2 font-medium">Utilidad</th>
                  <th className="text-right p-2 font-medium">Inconf.</th>
                </tr>
              </thead>
              <tbody>
                {topReproductores.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-medium">{r.nombre}</td>
                    <td className="p-2 text-right">{r.dosisVendidas}</td>
                    <td className="p-2 text-right text-emerald-600">{formatCurrency(r.ingresoTotal)}</td>
                    <td className="p-2 text-right text-red-600">{formatCurrency(r.costoTotal)}</td>
                    <td className={`p-2 text-right font-medium ${r.utilidad >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(r.utilidad)}</td>
                    <td className="p-2 text-right">{r.inconformidades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function CostosProduccion({
  especieFilter, animals, gastos, ventas, tratamientos, procedimientos, lotes, user,
  yeguas, inseminaciones, confirmaciones, partos, colectas, reproductores, despachos, inconformidades,
}) {
  if (especieFilter === "equino") {
    return <AnalisisEquinos yeguas={yeguas} inseminaciones={inseminaciones} confirmaciones={confirmaciones} partos={partos} colectas={colectas} gastos={gastos} reproductores={reproductores} despachos={despachos} inconformidades={inconformidades} />;
  }
  if (especieFilter === "bovino" || especieFilter === "ovino") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Ceba / Engorde</h3>
          <AnalisisCeba animals={animals} gastos={gastos} ventas={ventas} tratamientos={tratamientos} procedimientos={procedimientos} lotes={lotes} user={user} especie={especieFilter} />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Reproducción</h3>
          <AnalisisReproductivo animals={animals} gastos={gastos} inseminaciones={inseminaciones} confirmaciones={confirmaciones} partos={partos} especie={especieFilter} />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card className="!p-4">
        <h3 className="font-heading font-semibold mb-2">Análisis por especie</h3>
        <p className="text-sm text-muted-foreground">Filtra por una especie específica (🐄 Bovinos, 🐑 Ovinos o 🐴 Equinos) para ver el análisis detallado de costos de producción y rentabilidad.</p>
        <p className="text-xs text-muted-foreground mt-2">Cada especie tiene indicadores distintos: bovinos/ovinos se enfocan en costo por kilo y margen; equinos en costo por embrión, preñez y potro nacido.</p>
      </Card>
      {animals.filter((a) => (a.especie || "bovino") === "bovino" && a.estado === "activo").length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">🐄 Bovinos</h3>
          <AnalisisCeba animals={animals} gastos={gastos} ventas={ventas} tratamientos={tratamientos} procedimientos={procedimientos} lotes={lotes} user={user} especie="bovino" />
        </div>
      )}
      {animals.filter((a) => a.especie === "ovino" && a.estado === "activo").length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">🐑 Ovinos</h3>
          <AnalisisCeba animals={animals} gastos={gastos} ventas={ventas} tratamientos={tratamientos} procedimientos={procedimientos} lotes={lotes} user={user} especie="ovino" />
        </div>
      )}
      {yeguas.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">🐴 Equinos</h3>
          <AnalisisEquinos yeguas={yeguas} inseminaciones={inseminaciones} confirmaciones={confirmaciones} partos={partos} colectas={colectas} gastos={gastos} reproductores={reproductores} despachos={despachos} inconformidades={inconformidades} />
        </div>
      )}
    </div>
  );
}