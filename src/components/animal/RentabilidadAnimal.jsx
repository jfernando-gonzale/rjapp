import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatWeight } from "@/lib/helpers";
import { calcRentabilidadCeba, semaforoRentabilidad, getMargenesMinimos } from "@/lib/costosProduccion";
import SemaforoRentabilidad from "@/components/shared/SemaforoRentabilidad";

// Sección "Rentabilidad" para la hoja de vida del animal (bovinos/ovinos de ceba).
export default function RentabilidadAnimal({ animal, gastos, tratamientos, procedimientos, ventas, allAnimals, user }) {
  const especie = animal.especie || "bovino";
  if (especie === "equino") return null;

  const venta = ventas && ventas.length > 0 ? ventas.find((v) => v.animal_id === animal.id) || ventas[0] : null;
  const res = calcRentabilidadCeba(animal, gastos || [], tratamientos || [], procedimientos || [], venta ? [venta] : [], allAnimals || [animal], allAnimals || [animal], user);
  const margenes = getMargenesMinimos(user);
  const margenMinimo = margenes[especie] ?? 15;
  const sem = semaforoRentabilidad(res.rentabilidadPct, margenMinimo);

  const Fila = ({ label, valor, destacado, color }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${color || ""} ${destacado ? "font-bold" : ""}`}>{valor}</span>
    </div>
  );

  const datosFaltantes = [];
  if (res.pesoCompra == null) datosFaltantes.push("peso de compra");
  if (res.pesoActual == null) datosFaltantes.push("peso actual");
  if (res.costoAcumulado === 0) datosFaltantes.push("gastos asociados");

  return (
    <Card className={`p-4 mb-6 border-l-4 ${sem.nivel !== "sin_datos" ? "" : ""} ${
      sem.color === "green" ? "border-l-emerald-500" :
      sem.color === "yellow" ? "border-l-amber-500" :
      sem.color === "red" ? "border-l-red-500" : "border-l-gray-300"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold">Rentabilidad</h3>
        {res.tieneVenta ? (
          <SemaforoRentabilidad nivel={sem.color} label={sem.label} />
        ) : (
          <span className="text-xs text-muted-foreground">Sin venta registrada</span>
        )}
      </div>

      {res.costoAcumulado > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <div>
            <Fila label="Peso de compra" valor={res.pesoCompra != null ? formatWeight(res.pesoCompra) : "—"} />
            <Fila label="Peso actual" valor={res.pesoActual != null ? formatWeight(res.pesoActual) : "—"} />
            <Fila label="Kilos ganados" valor={res.kilosGanados != null ? `${res.kilosGanados.toFixed(1)} kg` : "—"} />
            {res.diasProduccion != null && <Fila label="Días en producción" valor={`${res.diasProduccion} días`} />}
          </div>
          <div>
            <Fila label="Costo acumulado" valor={formatCurrency(res.costoAcumulado)} destacado />
            <Fila label="Gastos de producción" valor={formatCurrency(res.gastosProduccion)} />
            <Fila label="Costo/kg ganado" valor={res.costoPorKgGanado != null ? `${formatCurrency(res.costoPorKgGanado)}/kg` : "—"} color="text-amber-600" />
            <Fila label="Costo/kg producido" valor={res.costoPorKgProducido != null ? `${formatCurrency(res.costoPorKgProducido)}/kg` : "—"} color="text-blue-600" />
          </div>

          {res.tieneVenta ? (
            <div className="sm:col-span-2 mt-2 pt-3 border-t">
              <Fila label="Precio de venta total" valor={formatCurrency(res.precioVentaTotal)} />
              <Fila label="Precio/kg de venta" valor={res.precioVentaKilo ? `${formatCurrency(res.precioVentaKilo)}/kg` : "—"} />
              <Fila label="Margen por kilo" valor={res.margenPorKg != null ? `${formatCurrency(res.margenPorKg)}/kg` : "—"} color={res.margenPorKg >= 0 ? "text-emerald-600" : "text-red-600"} />
              <Fila label="Punto de equilibrio/kg" valor={res.puntoEquilibrioKg != null ? `${formatCurrency(res.puntoEquilibrioKg)}/kg` : "—"} color="text-muted-foreground" />
              <Fila label="Utilidad" valor={formatCurrency(res.utilidad)} destacado color={res.utilidad >= 0 ? "text-emerald-600" : "text-red-600"} />
              {res.rentabilidadPct != null && (
                <Fila label="Rentabilidad" valor={`${res.rentabilidadPct.toFixed(1)}%`} destacado color={res.rentabilidadPct >= margenMinimo ? "text-emerald-600" : res.rentabilidadPct >= 0 ? "text-amber-600" : "text-red-600"} />
              )}
            </div>
          ) : (
            <div className="sm:col-span-2 mt-2 pt-3 border-t">
              {res.puntoEquilibrioKg != null && (
                <Fila label="Punto de equilibrio/kg" valor={`${formatCurrency(res.puntoEquilibrioKg)}/kg`} color="text-muted-foreground" />
              )}
              {res.utilidadProyectada != null ? (
                <Fila
                  label={`Utilidad proyectada (a ${formatCurrency(res.precioEstimadoVenta)}/kg)`}
                  valor={formatCurrency(res.utilidadProyectada)}
                  destacado
                  color={res.utilidadProyectada >= 0 ? "text-emerald-600" : "text-red-600"}
                />
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Configura un precio estimado de venta en <span className="font-medium">Configuración</span> para proyectar la utilidad si vendieras hoy.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          <p className="mb-1">Sin datos suficientes para calcular rentabilidad.</p>
          {datosFaltantes.length > 0 && <p>Falta registrar: {datosFaltantes.join(", ")}.</p>}
        </div>
      )}
    </Card>
  );
}