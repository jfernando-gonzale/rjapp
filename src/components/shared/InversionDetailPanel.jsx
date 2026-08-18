import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/shared/StatusBadge";
import { ESTADO_ANIMAL, formatCurrency, formatWeight, inversionAnimal } from "@/lib/helpers";
import { Search, X, Scale, Tag, Wallet } from "lucide-react";

/**
 * Panel de detalle financiero de inversión.
 * Muestra resumen superior + filtros + tabla con valores monetarios de compra por animal.
 * Cada fila abre la hoja de vida del animal.
 *
 * Props: open, onOpenChange, title, description, animals (array ya filtrado por especie)
 */
export default function InversionDetailPanel({ open, onOpenChange, title, description, animals = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [estadoF, setEstadoF] = useState("todos");
  const [fincaF, setFincaF] = useState("todas");
  const [razaF, setRazaF] = useState("todas");
  const [precioF, setPrecioF] = useState("todos"); // todos | con_precio | sin_precio
  const [invMin, setInvMin] = useState("");
  const [invMax, setInvMax] = useState("");

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const fincaName = (fid) => fincas.find(f => f.id === fid)?.nombre || "—";
  const loteName = (lid) => lotes.find(l => l.id === lid)?.nombre || "—";

  const razasDisponibles = useMemo(() => {
    const set = new Set();
    animals.forEach(a => { if (a.raza) set.add(a.raza); });
    return Array.from(set).sort();
  }, [animals]);

  const filtered = useMemo(() => {
    let res = [...animals];
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(a =>
        (a.numero || "").toLowerCase().includes(q) ||
        (a.nombre || "").toLowerCase().includes(q)
      );
    }
    if (estadoF !== "todos") res = res.filter(a => a.estado === estadoF);
    if (fincaF !== "todas") res = res.filter(a => a.finca_id === fincaF);
    if (razaF !== "todas") res = res.filter(a => a.raza === razaF);
    if (precioF === "con_precio") res = res.filter(a => a.precio_compra);
    if (precioF === "sin_precio") res = res.filter(a => !a.precio_compra);
    const min = invMin ? parseMoney(invMin) : 0;
    const max = invMax ? parseMoney(invMax) : Infinity;
    if (min > 0 || max < Infinity) {
      res = res.filter(a => {
        const inv = inversionAnimal(a);
        return inv >= min && inv <= max;
      });
    }
    return res;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, estadoF, fincaF, razaF, precioF, invMin, invMax, animals, fincas, lotes]);

  // Resumen superior (sobre el listado filtrado)
  const resumen = useMemo(() => {
    const total = filtered.reduce((s, a) => s + inversionAnimal(a), 0);
    const count = filtered.length;
    const promedio = count > 0 ? Math.round(total / count) : 0;
    const conPeso = filtered.filter(a => a.peso_compra);
    const pesoProm = conPeso.length > 0
      ? Math.round(conPeso.reduce((s, a) => s + (a.peso_compra || 0), 0) / conPeso.length)
      : 0;
    const conPrecioKg = filtered.filter(a => a.precio_kilo_compra);
    const precioKgProm = conPrecioKg.length > 0
      ? Math.round(conPrecioKg.reduce((s, a) => s + (a.precio_kilo_compra || 0), 0) / conPrecioKg.length)
      : 0;
    return { total, count, promedio, pesoProm, precioKgProm };
  }, [filtered]);

  const handleRowClick = (a) => {
    onOpenChange(false);
    navigate(`/animales/${a.id}`);
  };

  const resetFiltros = () => {
    setSearch(""); setEstadoF("todos"); setFincaF("todas");
    setRazaF("todas"); setPrecioF("todos"); setInvMin(""); setInvMax("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Resumen superior */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
          <Card className="p-3 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><Wallet className="w-3 h-3" /> Inversión total</div>
            <p className="text-base font-heading font-bold text-amber-700">{formatCurrency(resumen.total)}</p>
          </Card>
          <Card className="p-3">
            <div className="text-[11px] text-muted-foreground font-medium">Animales incluidos</div>
            <p className="text-base font-heading font-bold">{resumen.count}</p>
          </Card>
          <Card className="p-3">
            <div className="text-[11px] text-muted-foreground font-medium">Promedio / animal</div>
            <p className="text-base font-heading font-bold">{formatCurrency(resumen.promedio)}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><Scale className="w-3 h-3" /> Peso prom. compra</div>
            <p className="text-base font-heading font-bold">{resumen.pesoProm > 0 ? `${resumen.pesoProm} kg` : "—"}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><Tag className="w-3 h-3" /> Precio prom. /kg</div>
            <p className="text-base font-heading font-bold">{resumen.precioKgProm > 0 ? formatCurrency(resumen.precioKgProm) : "—"}</p>
          </Card>
        </div>

        {/* Buscador */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número / chapeta o nombre..."
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-2">
          <Select value={estadoF} onValueChange={setEstadoF}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {Object.entries(ESTADO_ANIMAL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fincaF} onValueChange={setFincaF}>
            <SelectTrigger><SelectValue placeholder="Finca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fincas</SelectItem>
              {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={razaF} onValueChange={setRazaF}>
            <SelectTrigger><SelectValue placeholder="Raza" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las razas</SelectItem>
              {razasDisponibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={precioF} onValueChange={setPrecioF}>
            <SelectTrigger><SelectValue placeholder="Precio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Con y sin precio</SelectItem>
              <SelectItem value="con_precio">Con precio de compra</SelectItem>
              <SelectItem value="sin_precio">Sin precio de compra</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Input value={invMin} onChange={(e) => setInvMin(e.target.value)} placeholder="Inv. mín $" className="text-xs" />
            <Input value={invMax} onChange={(e) => setInvMax(e.target.value)} placeholder="Inv. máx $" className="text-xs" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length} de {animals.length} animales
          </p>
          <button onClick={resetFiltros} className="text-xs text-amber-600 hover:underline">Limpiar filtros</button>
        </div>

        {/* Tabla / lista de animales con detalle financiero */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {filtered.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">No hay animales que coincidan con los filtros</Card>
          ) : (
            filtered.map(a => {
              const inv = inversionAnimal(a);
              return (
                <button key={a.id} onClick={() => handleRowClick(a)} className="w-full text-left">
                  <Card className="p-3 hover:shadow-md hover:border-amber-400 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">#{a.numero}</span>
                          {a.nombre && <span className="text-sm text-muted-foreground">({a.nombre})</span>}
                          <StatusBadge status={a.estado} label={ESTADO_ANIMAL[a.estado]} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.sexo === "hembra" ? "Hembra" : "Macho"}{a.raza ? ` · ${a.raza}` : ""} · {fincaName(a.finca_id)} · {loteName(a.lote_id)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">Inversión total</p>
                        <p className="text-base font-heading font-bold text-amber-700">{formatCurrency(inv)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-1 mt-2 pt-2 border-t border-border text-xs">
                      <div>
                        <span className="text-muted-foreground">Fecha compra: </span>
                        <span className="font-medium">{a.fecha_compra || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Peso compra: </span>
                        <span className="font-medium">{a.peso_compra ? formatWeight(a.peso_compra) : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Precio/kg: </span>
                        <span className="font-medium">{a.precio_kilo_compra ? formatCurrency(a.precio_kilo_compra) : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Precio compra: </span>
                        <span className="font-medium">{a.precio_compra ? formatCurrency(a.precio_compra) : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transporte: </span>
                        <span className="font-medium">{a.costo_transporte_inicial ? formatCurrency(a.costo_transporte_inicial) : "$ 0"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Otros costos: </span>
                        <span className="font-medium">{a.otros_costos_iniciales ? formatCurrency(a.otros_costos_iniciales) : "$ 0"}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-600 mt-1.5">Ver hoja de vida →</p>
                  </Card>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function parseMoney(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}