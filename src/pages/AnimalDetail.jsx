import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Weight, Syringe, DollarSign, ShoppingCart, ClipboardList, Download } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import GainIndicator from "@/components/shared/GainIndicator";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { formatCurrency, formatWeight, ESTADO_ANIMAL, SEXO_ANIMAL, TIPO_TRATAMIENTO, TIPO_PROCEDIMIENTO, CATEGORIA_GASTOS } from "@/lib/helpers";
import { exportToCsv } from "@/lib/csv";
import { calcGainFromPesajes, classifyGain, getThresholds, isPotro } from "@/lib/gananciaUtils";
import { getTerminologia } from "@/lib/reproduccion";
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
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const thresholds = getThresholds(user);

  // Historial reproductivo (entidades usan yegua_id para todas las especies)
  const { data: inseminaciones = [] } = useQuery({
    queryKey: ["inseminaciones-animal", id],
    queryFn: () => base44.entities.Inseminacion.filter({ yegua_id: id }),
  });
  const { data: confirmacionesRepro = [] } = useQuery({
    queryKey: ["confirmaciones-animal", id],
    queryFn: () => base44.entities.ConfirmacionPreñez.filter({ yegua_id: id }),
  });
  const { data: partosRepro = [] } = useQuery({
    queryKey: ["partos-animal", id],
    queryFn: () => base44.entities.Parto.filter({ yegua_id: id }),
  });

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

  // Daily gain from last 2 pesajes (misma lógica que Reportes / RankingGanancia)
  const especie = animal.especie || "bovino";
  const gainInfo = calcGainFromPesajes(sortedPesajes);
  const gainClassification = gainInfo ? classifyGain(gainInfo.gain, especie, thresholds) : null;
  const showGain = especie !== "equino" || isPotro(animal);

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
          <DeleteConfirmButton
            entityName="Animal"
            recordId={id}
            recordLabel={`el animal #${animal.numero}`}
            warningText="Eliminar este animal también puede afectar sus pesajes, tratamientos, procedimientos, ventas, reproducción y reportes. Considera marcarlo como inactivo desde Editar si quieres conservar el historial."
            queryKeysToInvalidate={["animals"]}
            iconOnly={false}
            onDeleted={() => navigate("/animales")}
          />
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
          {showGain && gainInfo ? (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${gainClassification.bg} ${gainClassification.text}`}>
              <span className={`w-2 h-2 rounded-full ${gainClassification.dot}`} />
              {gainInfo.gain.toFixed(2)} kg/día
              <span className="opacity-70">· {gainClassification.label}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{!showGain ? "N/A adultos" : "Sin datos"}</p>
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

      {/* Historial reproductivo */}
      {(() => {
        const T = getTerminologia(especie);
        const criaLabel = (sexo) => {
          if (sexo === "macho") return T.criaSingular || "Cría";
          if (sexo === "hembra") return T.criaSingularHembra || "Cría";
          return "Cría";
        };
        const hasRepro = inseminaciones.length > 0 || confirmacionesRepro.length > 0 || partosRepro.length > 0;
        return (
          <Card className="p-4 mb-6">
            <h3 className="font-heading font-semibold mb-3">Historial reproductivo</h3>
            {!hasRepro ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin historial reproductivo registrado.</p>
            ) : (
              <div className="space-y-3">
                {inseminaciones.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      {especie === "ovino" ? "Servicios / Montas" : "Inseminaciones / Montas"}
                    </p>
                    <div className="space-y-1.5">
                      {[...inseminaciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(ins => (
                        <div key={ins.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium capitalize">{(ins.tipo || "servicio").replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(ins.fecha), "dd MMM yyyy", { locale: es })}{ins.reproductor ? ` · ${ins.reproductor}` : ""}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            ins.resultado === "preñada" ? "bg-emerald-100 text-emerald-700" :
                            ins.resultado === "pendiente" ? "bg-amber-100 text-amber-700" :
                            ins.resultado === "repitio_celo" || ins.resultado === "fallida" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{ins.resultado?.replace(/_/g, " ") || "pendiente"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {confirmacionesRepro.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Confirmaciones de preñez</p>
                    <div className="space-y-1.5">
                      {[...confirmacionesRepro].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(conf => (
                        <div key={conf.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium capitalize">{conf.metodo || "Confirmación"}{conf.veterinario ? ` · ${conf.veterinario}` : ""}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(conf.fecha), "dd MMM yyyy", { locale: es })}</p>
                          </div>
                          {conf.fecha_probable_parto && <span className="text-xs text-blue-600 font-medium">Parto: {conf.fecha_probable_parto}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {partosRepro.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Partos</p>
                    <div className="space-y-1.5">
                      {[...partosRepro].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(pt => (
                        <div key={pt.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{pt.nombre_cria || criaLabel(pt.sexo_cria)} · {criaLabel(pt.sexo_cria)}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(pt.fecha), "dd MMM yyyy", { locale: es })}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            pt.resultado === "cria_viva" ? "bg-emerald-100 text-emerald-700" :
                            pt.resultado === "aborto" || pt.resultado === "cria_muerta" || pt.resultado === "complicacion" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{(pt.resultado || "cria_viva").replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })()}

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