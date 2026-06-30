import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Weight, Syringe, DollarSign, ShoppingCart, ClipboardList, Download } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import GainIndicator from "@/components/shared/GainIndicator";
import { formatCurrency, formatWeight, daysBetween, calcDailyGain, ESTADO_ANIMAL, SEXO_ANIMAL, TIPO_TRATAMIENTO, TIPO_PROCEDIMIENTO, CATEGORIA_GASTOS } from "@/lib/helpers";
import { exportToCsv } from "@/lib/csv";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: animal, isLoading } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => base44.entities.Animal.filter({ id }),
    select: (data) => data[0],
  });

  const { data: pesajes = [] } = useQuery({
    queryKey: ["pesajes", id],
    queryFn: () => base44.entities.Pesaje.filter({ animal_id: id }),
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ["tratamientos-animal", id],
    queryFn: () => base44.entities.Tratamiento.filter({ animal_id: id }),
  });

  const { data: procedimientos = [] } = useQuery({
    queryKey: ["procedimientos-animal", id],
    queryFn: () => base44.entities.Procedimiento.filter({ animal_id: id }),
  });

  const { data: gastos = [] } = useQuery({
    queryKey: ["gastos-animal", id],
    queryFn: () => base44.entities.Gasto.filter({ animal_id: id }),
  });

  const { data: ventas = [] } = useQuery({
    queryKey: ["ventas-animal", id],
    queryFn: () => base44.entities.Venta.filter({ animal_id: id }),
  });

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  if (isLoading || !animal) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const getFincaName = (fid) => fincas.find(f => f.id === fid)?.nombre || "—";
  const getLoteName = (lid) => lotes.find(l => l.id === lid)?.nombre || "—";

  const sortedPesajes = [...pesajes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const totalGastos = gastos.reduce((s, g) => s + (g.valor || 0), 0);
  const totalTratamientosCost = tratamientos.reduce((s, t) => s + (t.costo || 0), 0);
  const costoTotal = (animal.precio_compra || 0) + (animal.costo_transporte_inicial || 0) + (animal.otros_costos_iniciales || 0) + totalGastos + totalTratamientosCost;
  
  const venta = ventas.length > 0 ? ventas[0] : null;
  const utilidadNeta = venta ? (venta.precio_total || 0) - costoTotal - (venta.costo_transporte || 0) - (venta.comision || 0) - (venta.otros_descuentos || 0) : null;
  const rentabilidad = utilidadNeta != null && costoTotal > 0 ? (utilidadNeta / costoTotal) * 100 : null;

  // Daily gain from purchase
  const gainFromPurchase = animal.ultimo_peso && animal.peso_compra && animal.fecha_compra && animal.fecha_ultimo_pesaje
    ? calcDailyGain(animal.ultimo_peso, animal.peso_compra, daysBetween(animal.fecha_compra, animal.fecha_ultimo_pesaje))
    : null;

  // Chart data
  const chartData = sortedPesajes.map(p => ({
    fecha: format(new Date(p.fecha), "dd MMM", { locale: es }),
    peso: p.peso,
  }));
  if (animal.peso_compra && animal.fecha_compra && (sortedPesajes.length === 0 || sortedPesajes[0].fecha > animal.fecha_compra)) {
    chartData.unshift({ fecha: format(new Date(animal.fecha_compra), "dd MMM", { locale: es }), peso: animal.peso_compra });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold">#{animal.numero}</h1>
            {animal.nombre && <span className="text-lg text-muted-foreground">({animal.nombre})</span>}
            <StatusBadge status={animal.estado} label={ESTADO_ANIMAL[animal.estado]} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getFincaName(animal.finca_id)} • {getLoteName(animal.lote_id)} • {SEXO_ANIMAL[animal.sexo] || "—"} • {animal.raza || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => exportToCsv(`hoja-vida-${animal.numero || id}.csv`, [{
            numero: animal.numero, especie: animal.especie, nombre: animal.nombre, sexo: animal.sexo, raza: animal.raza, color: animal.color,
            finca: getFincaName(animal.finca_id), lote: getLoteName(animal.lote_id), estado: animal.estado,
            fecha_nacimiento: animal.fecha_nacimiento, peso_compra: animal.peso_compra, ultimo_peso: animal.ultimo_peso,
            fecha_compra: animal.fecha_compra, precio_compra: animal.precio_compra, costo_acumulado: costoTotal,
            tratamientos: tratamientos.length, procedimientos: procedimientos.length, pesajes: pesajes.length,
            gastos: totalGastos,
          }])}><Download className="w-4 h-4" /> Exportar</Button>
          <Link to={`/animales/${id}/editar`}>
            <Button variant="outline" className="gap-2"><Pencil className="w-4 h-4" /> Editar</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{animal.ultimo_peso ? formatWeight(animal.ultimo_peso) : "—"}</p>
          <p className="text-xs text-muted-foreground">Último peso</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{animal.peso_compra ? formatWeight(animal.peso_compra) : "—"}</p>
          <p className="text-xs text-muted-foreground">Peso inicial</p>
        </Card>
        <Card className="p-4 text-center">
          {gainFromPurchase != null ? (
            <GainIndicator dailyGain={gainFromPurchase} size="lg" />
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Ganancia diaria</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{formatCurrency(costoTotal)}</p>
          <p className="text-xs text-muted-foreground">Costo acumulado</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-6">
        <Link to={`/pesajes/nuevo?animal=${id}`}>
          <Button variant="outline" className="w-full gap-2 h-12"><Weight className="w-4 h-4" /> Pesar</Button>
        </Link>
        <Link to={`/tratamientos/nuevo?animal=${id}`}>
          <Button variant="outline" className="w-full gap-2 h-12"><Syringe className="w-4 h-4" /> Tratamiento</Button>
        </Link>
        <Link to={`/procedimientos/nuevo?animal=${id}`}>
          <Button variant="outline" className="w-full gap-2 h-12"><ClipboardList className="w-4 h-4" /> Proced.</Button>
        </Link>
        <Link to={`/gastos/nuevo?animal=${id}`}>
          <Button variant="outline" className="w-full gap-2 h-12"><DollarSign className="w-4 h-4" /> Gasto</Button>
        </Link>
        <Link to={`/ventas/nueva?animal=${id}`}>
          <Button variant="outline" className="w-full gap-2 h-12"><ShoppingCart className="w-4 h-4" /> Vender</Button>
        </Link>
      </div>

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <Card className="p-4 mb-6">
          <h3 className="font-heading font-semibold mb-3">Evolución de peso</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v) => [`${v} kg`, "Peso"]} />
                <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Pesajes History */}
      <Card className="p-4 mb-6">
        <h3 className="font-heading font-semibold mb-3">Historial de pesajes ({pesajes.length})</h3>
        {sortedPesajes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sin pesajes registrados</p>
        ) : (
          <div className="space-y-2">
            {[...sortedPesajes].reverse().map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{formatWeight(p.peso)}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.fecha), "dd MMM yyyy", { locale: es })}</p>
                </div>
                <div className="text-right">
                  {p.diferencia_peso != null && (
                    <p className={`text-sm font-medium ${p.diferencia_peso >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {p.diferencia_peso >= 0 ? "+" : ""}{p.diferencia_peso.toFixed(1)} kg
                    </p>
                  )}
                  {p.ganancia_diaria != null && <GainIndicator dailyGain={p.ganancia_diaria} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Treatments History */}
      <Card className="p-4 mb-6">
        <h3 className="font-heading font-semibold mb-3">Historial sanitario ({tratamientos.length})</h3>
        {tratamientos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sin tratamientos registrados</p>
        ) : (
          <div className="space-y-2">
            {tratamientos.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{TIPO_TRATAMIENTO[t.tipo] || t.tipo}</p>
                  <p className="text-xs text-muted-foreground">{t.producto || "—"} • {format(new Date(t.fecha), "dd MMM yyyy", { locale: es })}</p>
                </div>
                {t.costo > 0 && <p className="text-sm font-medium">{formatCurrency(t.costo)}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Procedures History */}
      <Card className="p-4 mb-6">
        <h3 className="font-heading font-semibold mb-3">Procedimientos / Manejos ({procedimientos.length})</h3>
        {procedimientos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sin procedimientos registrados</p>
        ) : (
          <div className="space-y-2">
            {procedimientos.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{TIPO_PROCEDIMIENTO[p.tipo] || p.tipo}{p.detalle ? ` (${p.detalle})` : ""}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.fecha), "dd MMM yyyy", { locale: es })}{p.responsable ? ` • ${p.responsable}` : ""}</p>
                </div>
                {p.costo > 0 && <p className="text-sm font-medium">{formatCurrency(p.costo)}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sale info */}
      {venta && (
        <Card className="p-4 mb-6 border-l-4 border-l-blue-400">
          <h3 className="font-heading font-semibold mb-3">Información de venta</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Fecha:</span> <span className="font-medium">{format(new Date(venta.fecha), "dd MMM yyyy", { locale: es })}</span></div>
            <div><span className="text-muted-foreground">Peso venta:</span> <span className="font-medium">{formatWeight(venta.peso_venta)}</span></div>
            <div><span className="text-muted-foreground">Precio total:</span> <span className="font-medium">{formatCurrency(venta.precio_total)}</span></div>
            <div><span className="text-muted-foreground">Precio/kg:</span> <span className="font-medium">{formatCurrency(venta.precio_kilo)}</span></div>
            <div><span className="text-muted-foreground">Costo total:</span> <span className="font-medium">{formatCurrency(costoTotal)}</span></div>
            <div>
              <span className="text-muted-foreground">Utilidad:</span>{" "}
              <span className={`font-bold ${utilidadNeta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(utilidadNeta)}
              </span>
            </div>
            {rentabilidad != null && (
              <div><span className="text-muted-foreground">Rentabilidad:</span> <span className={`font-bold ${rentabilidad >= 0 ? "text-emerald-600" : "text-red-600"}`}>{rentabilidad.toFixed(1)}%</span></div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}