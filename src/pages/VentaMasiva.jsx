import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, Search, ShoppingCart, Layers, DollarSign } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency, formatWeight, ESPECIES, parseMoney } from "@/lib/helpers";
import MoneyInput from "@/components/shared/MoneyInput";
import { useToast } from "@/components/ui/use-toast";

const emptyGeneral = {
  fecha: new Date().toISOString().split("T")[0],
  especie: "bovino",
  finca_id: "",
  lote_id: "",
  comprador: "",
  precio_kilo: "",
  precio_total_grupo: "",
  transporte: "",
  comision: "",
  otros_descuentos: "",
  observaciones: "",
};

export default function VentaMasiva() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [general, setGeneral] = useState(emptyGeneral);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [animalData, setAnimalData] = useState({});
  const [distMode, setDistMode] = useState("peso");
  const [search, setSearch] = useState("");
  const [filterSexo, setFilterSexo] = useState("all");
  const [saving, setSaving] = useState(false);

  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const fincaName = (id) => fincas.find((f) => f.id === id)?.nombre || "";
  const loteName = (id) => lotes.find((l) => l.id === id)?.nombre || "";

  const availableAnimals = useMemo(() => animals.filter((a) => {
    if (a.estado !== "activo") return false;
    if (general.especie !== "general" && a.especie !== general.especie) return false;
    if (general.finca_id && a.finca_id !== general.finca_id) return false;
    if (general.lote_id && a.lote_id !== general.lote_id) return false;
    if (filterSexo !== "all" && a.sexo !== filterSexo) return false;
    if (search && !String(a.numero || "").includes(search) && !(a.nombre || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [animals, general.especie, general.finca_id, general.lote_id, filterSexo, search]);

  const selectedAnimals = useMemo(() => availableAnimals.filter((a) => selectedIds.has(a.id)), [availableAnimals, selectedIds]);

  const toggleAnimal = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (availableAnimals.every((a) => selectedIds.has(a.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableAnimals.map((a) => a.id)));
    }
  };

  const getAnimalField = (id, field) => animalData[id]?.[field] ?? "";
  const setAnimalField = (id, field, value) => {
    setAnimalData((prev) => {
      const current = prev[id] || {};
      const next = { ...current, [field]: value };
      const peso = parseFloat(next.peso_venta) || 0;
      const kilo = parseFloat(next.precio_kilo) || parseFloat(general.precio_kilo) || 0;
      if (field === "peso_venta" || field === "precio_kilo") {
        next.precio_total = peso && kilo ? Math.round(peso * kilo) : next.precio_total || "";
      }
      return { ...prev, [id]: next };
    });
  };

  // Auto-fill peso_venta from ultimo_peso on selection
  const fillDefaultPesos = () => {
    setAnimalData((prev) => {
      const next = { ...prev };
      selectedAnimals.forEach((a) => {
        if (!next[a.id]?.peso_venta && a.ultimo_peso) {
          next[a.id] = { ...next[a.id], peso_venta: String(a.ultimo_peso) };
        }
      });
      return next;
    });
  };

  const totalPeso = selectedAnimals.reduce((s, a) => s + (parseFloat(getAnimalField(a.id, "peso_venta")) || a.ultimo_peso || 0), 0);
  const totalVenta = selectedAnimals.reduce((s, a) => s + (parseFloat(getAnimalField(a.id, "precio_total")) || 0), 0);

  const distributeGroupPrice = () => {
    const grupoTotal = parseFloat(general.precio_total_grupo);
    if (!grupoTotal || selectedAnimals.length === 0) return;
    setAnimalData((prev) => {
      const next = { ...prev };
      selectedAnimals.forEach((a) => {
        const peso = parseFloat(getAnimalField(a.id, "peso_venta")) || a.ultimo_peso || 0;
        let portion;
        if (distMode === "igual") portion = grupoTotal / selectedAnimals.length;
        else portion = totalPeso > 0 ? (peso / totalPeso) * grupoTotal : grupoTotal / selectedAnimals.length;
        const kilo = peso > 0 ? Math.round(portion / peso) : 0;
        next[a.id] = { ...next[a.id], precio_total: Math.round(portion), precio_kilo: kilo };
      });
      return next;
    });
  };

  const gastosTotales = (parseFloat(general.transporte) || 0) + (parseFloat(general.comision) || 0) + (parseFloat(general.otros_descuentos) || 0);
  const utilidadEstimada = selectedAnimals.reduce((s, a) => {
    const precioTotal = parseFloat(getAnimalField(a.id, "precio_total")) || 0;
    const costoAnimal = (a.precio_compra || 0) + (a.costo_transporte_inicial || 0) + (a.otros_costos_iniciales || 0);
    const gastoProp = totalPeso > 0 ? ((parseFloat(getAnimalField(a.id, "peso_venta")) || a.ultimo_peso || 0) / totalPeso) * gastosTotales : gastosTotales / selectedAnimals.length;
    return s + (precioTotal - costoAnimal - gastoProp);
  }, 0);

  const canStep1 = general.fecha && general.especie;
  const canStep2 = selectedAnimals.length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const ventaMasivaId = `VM-${Date.now()}`;
      const gastosPorAnimal = totalPeso > 0 ? gastosTotales : 0;
      const ventas = selectedAnimals.map((a) => {
        const pesoVenta = parseFloat(getAnimalField(a.id, "peso_venta")) || a.ultimo_peso || 0;
        const precioKilo = parseFloat(getAnimalField(a.id, "precio_kilo")) || parseFloat(general.precio_kilo) || 0;
        const precioTotal = parseFloat(getAnimalField(a.id, "precio_total")) || Math.round(pesoVenta * precioKilo);
        const costoAnimal = (a.precio_compra || 0) + (a.costo_transporte_inicial || 0) + (a.otros_costos_iniciales || 0);
        const gastoProp = totalPeso > 0 ? (pesoVenta / totalPeso) * gastosTotales : gastosTotales / selectedAnimals.length;
        return {
          fecha: general.fecha,
          especie: general.especie,
          animal_id: a.id,
          finca_id: a.finca_id || general.finca_id || undefined,
          lote_id: a.lote_id || general.lote_id || undefined,
          peso_venta: pesoVenta || undefined,
          precio_kilo: precioKilo || undefined,
          precio_total: precioTotal,
          comprador: general.comprador || undefined,
          costo_transporte: totalPeso > 0 ? Math.round((pesoVenta / totalPeso) * (parseFloat(general.transporte) || 0)) : undefined,
          comision: totalPeso > 0 ? Math.round((pesoVenta / totalPeso) * (parseFloat(general.comision) || 0)) : undefined,
          otros_descuentos: totalPeso > 0 ? Math.round((pesoVenta / totalPeso) * (parseFloat(general.otros_descuentos) || 0)) : undefined,
          venta_masiva_id: ventaMasivaId,
          utilidad_estimada: Math.round(precioTotal - costoAnimal - gastoProp),
          observaciones: [getAnimalField(a.id, "observacion"), general.observaciones].filter(Boolean).join(" | ") || undefined,
        };
      });

      await base44.entities.Venta.bulkCreate(ventas);
      await base44.entities.Animal.bulkUpdate(selectedAnimals.map((a) => ({ id: a.id, estado: "vendido" })));

      qc.invalidateQueries({ queryKey: ["ventas"] });
      qc.invalidateQueries({ queryKey: ["animals"] });
      toast({ title: `Venta masiva registrada: ${ventas.length} animales vendidos` });
      navigate("/ventas");
    } catch (err) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const stepLabels = ["Datos generales", "Selección", "Detalle", "Confirmación"];

  return (
    <div>
      <PageHeader title="Venta Masiva por Lote" subtitle="Vende varios animales en una sola operación" />

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 ${step === i + 1 ? "text-amber-600" : step > i + 1 ? "text-emerald-600" : "text-gray-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === i + 1 ? "bg-amber-500 text-black" : step > i + 1 ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{label}</span>
            </div>
            {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 ${step > i + 1 ? "bg-emerald-400" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: General */}
      {step === 1 && (
        <Card className="p-5 max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha de venta *</Label>
              <Input type="date" value={general.fecha} onChange={(e) => setGeneral((p) => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div>
              <Label>Especie *</Label>
              <Select value={general.especie} onValueChange={(v) => setGeneral((p) => ({ ...p, especie: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESPECIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Finca</Label>
              <Select value={general.finca_id} onValueChange={(v) => setGeneral((p) => ({ ...p, finca_id: v, lote_id: "" }))}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todas las fincas</SelectItem>
                  {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote / Potrero</Label>
              <Select value={general.lote_id} onValueChange={(v) => setGeneral((p) => ({ ...p, lote_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos los lotes</SelectItem>
                  {lotes.filter((l) => !general.finca_id || l.finca_id === general.finca_id).map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Comprador / Cliente</Label>
            <Input value={general.comprador} onChange={(e) => setGeneral((p) => ({ ...p, comprador: e.target.value }))} placeholder="Nombre del comprador" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Precio por kilo (general)</Label>
              <MoneyInput value={general.precio_kilo} onChange={(v) => setGeneral((p) => ({ ...p, precio_kilo: v }))} placeholder="Opcional" />
            </div>
            <div>
              <Label>Precio total del grupo</Label>
              <MoneyInput value={general.precio_total_grupo} onChange={(v) => setGeneral((p) => ({ ...p, precio_total_grupo: v }))} placeholder="Opcional" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Transporte</Label><MoneyInput value={general.transporte} onChange={(v) => setGeneral((p) => ({ ...p, transporte: v }))} placeholder="0" /></div>
            <div><Label>Comisión</Label><MoneyInput value={general.comision} onChange={(v) => setGeneral((p) => ({ ...p, comision: v }))} placeholder="0" /></div>
            <div><Label>Otros</Label><MoneyInput value={general.otros_descuentos} onChange={(v) => setGeneral((p) => ({ ...p, otros_descuentos: v }))} placeholder="0" /></div>
          </div>
          <div>
            <Label>Observaciones generales</Label>
            <Textarea value={general.observaciones} onChange={(e) => setGeneral((p) => ({ ...p, observaciones: e.target.value }))} rows={2} />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canStep1} className="gap-2">Continuar <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Selection */}
      {step === 2 && (
        <Card className="p-5 space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterSexo} onValueChange={setFilterSexo}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="macho">Machos</SelectItem>
                <SelectItem value="hembra">Hembras</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={toggleAll} className="gap-2">
              <Layers className="w-4 h-4" /> {availableAnimals.every((a) => selectedIds.has(a.id)) && availableAnimals.length > 0 ? "Quitar todos" : "Seleccionar todos"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{availableAnimals.length} animales disponibles • {selectedAnimals.length} seleccionados</p>

          <div className="rounded-lg border overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 w-8"></th>
                  <th className="text-left p-2 font-medium">N°</th>
                  <th className="text-left p-2 font-medium">Sexo</th>
                  <th className="text-left p-2 font-medium">Raza</th>
                  <th className="text-right p-2 font-medium">Peso</th>
                  <th className="text-left p-2 font-medium">Lote</th>
                </tr>
              </thead>
              <tbody>
                {availableAnimals.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => toggleAnimal(a.id)}>
                    <td className="p-2"><Checkbox checked={selectedIds.has(a.id)} /></td>
                    <td className="p-2 font-medium">#{a.numero}</td>
                    <td className="p-2 capitalize">{a.sexo || "—"}</td>
                    <td className="p-2">{a.raza || "—"}</td>
                    <td className="p-2 text-right">{a.ultimo_peso ? formatWeight(a.ultimo_peso) : "—"}</td>
                    <td className="p-2">{loteName(a.lote_id) || "—"}</td>
                  </tr>
                ))}
                {availableAnimals.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay animales activos que coincidan con los filtros</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Atrás</Button>
            <Button onClick={() => { fillDefaultPesos(); setStep(3); }} disabled={!canStep2} className="gap-2">Continuar <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Individual data */}
      {step === 3 && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Distribuir precio del grupo por:</Label>
              <Select value={distMode} onValueChange={setDistMode}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="peso">Peso</SelectItem>
                  <SelectItem value="igual">Partes iguales</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={distributeGroupPrice} disabled={!general.precio_total_grupo} className="gap-2">
                <DollarSign className="w-4 h-4" /> Distribuir
              </Button>
            </div>
            <p className="text-sm font-medium">Total: {formatCurrency(totalVenta)}</p>
          </div>

          <div className="rounded-lg border overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">Animal</th>
                  <th className="text-right p-2 font-medium">Últ. peso</th>
                  <th className="text-right p-2 font-medium">Peso venta</th>
                  <th className="text-right p-2 font-medium">$/Kilo</th>
                  <th className="text-right p-2 font-medium">Total</th>
                  <th className="text-left p-2 font-medium">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {selectedAnimals.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-2 font-medium">#{a.numero}</td>
                    <td className="p-2 text-right text-muted-foreground">{a.ultimo_peso || "—"}</td>
                    <td className="p-1"><Input type="number" step="0.1" className="h-8 text-xs text-right w-20" value={getAnimalField(a.id, "peso_venta")} onChange={(e) => setAnimalField(a.id, "peso_venta", e.target.value)} /></td>
                    <td className="p-1"><MoneyInput className="h-8 text-xs text-right w-20" value={getAnimalField(a.id, "precio_kilo")} onChange={(v) => setAnimalField(a.id, "precio_kilo", v)} /></td>
                    <td className="p-1"><MoneyInput className="h-8 text-xs text-right w-24" value={getAnimalField(a.id, "precio_total")} onChange={(v) => setAnimalField(a.id, "precio_total", v)} /></td>
                    <td className="p-1"><Input className="h-8 text-xs w-24" value={getAnimalField(a.id, "observacion")} onChange={(e) => setAnimalField(a.id, "observacion", e.target.value)} placeholder="—" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Atrás</Button>
            <Button onClick={() => setStep(4)} className="gap-2">Revisar <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Confirmation */}
      {step === 4 && (
        <Card className="p-5 max-w-2xl space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-heading font-semibold text-amber-800 mb-2">Resumen de venta masiva</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Animales:</span> <span className="font-medium">{selectedAnimals.length}</span></div>
              <div><span className="text-muted-foreground">Especie:</span> <span className="font-medium capitalize">{ESPECIES[general.especie]}</span></div>
              <div><span className="text-muted-foreground">Fecha:</span> <span className="font-medium">{general.fecha}</span></div>
              <div><span className="text-muted-foreground">Comprador:</span> <span className="font-medium">{general.comprador || "—"}</span></div>
              <div><span className="text-muted-foreground">Finca:</span> <span className="font-medium">{fincaName(general.finca_id) || "—"}</span></div>
              <div><span className="text-muted-foreground">Lote:</span> <span className="font-medium">{loteName(general.lote_id) || "—"}</span></div>
              <div><span className="text-muted-foreground">Peso total:</span> <span className="font-medium">{formatWeight(totalPeso)}</span></div>
              <div><span className="text-muted-foreground">Valor total:</span> <span className="font-medium">{formatCurrency(totalVenta)}</span></div>
              <div><span className="text-muted-foreground">Gastos:</span> <span className="font-medium">{formatCurrency(gastosTotales)}</span></div>
              <div><span className="text-muted-foreground">Utilidad est.:</span> <span className={`font-medium ${utilidadEstimada >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(utilidadEstimada)}</span></div>
            </div>
          </div>

          <div className="rounded-lg border max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2">Animal</th>
                  <th className="text-right p-2">Peso</th>
                  <th className="text-right p-2">$/Kilo</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedAnimals.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-2 font-medium">#{a.numero}</td>
                    <td className="p-2 text-right">{getAnimalField(a.id, "peso_venta") || a.ultimo_peso || "—"}</td>
                    <td className="p-2 text-right">{formatCurrency(parseMoney(getAnimalField(a.id, "precio_kilo") || general.precio_kilo) || 0)}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(parseFloat(getAnimalField(a.id, "precio_total")) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <ShoppingCart className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">Al confirmar, los {selectedAnimals.length} animales seleccionados pasarán a estado <strong>Vendido</strong> y dejarán de contarse como activos. Se creará un registro de venta por cada animal.</p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Atrás</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? "Guardando..." : <><Check className="w-4 h-4" /> Confirmar venta masiva</>}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}