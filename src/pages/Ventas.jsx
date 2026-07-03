import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Plus, Layers } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, formatWeight, TIPO_VENTA, parseMoney } from "@/lib/helpers";
import MoneyInput from "@/components/shared/MoneyInput";
import CsvExportButton from "@/components/shared/CsvExportButton";
import ImportCsvDialog from "@/components/shared/ImportCsvDialog";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESPECIE_COLORS = {
  bovino: "bg-amber-100 text-amber-800",
  ovino: "bg-green-100 text-green-800",
  equino: "bg-blue-100 text-blue-800",
  semen_equino: "bg-purple-100 text-purple-800",
  servicio_reproductivo: "bg-rose-100 text-rose-800",
  otro: "bg-gray-100 text-gray-600",
};

export default function Ventas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = window.location.pathname.includes("/nueva");
  const urlParams = new URLSearchParams(window.location.search);
  const preAnimal = urlParams.get("animal");

  const [dialogOpen, setDialogOpen] = useState(isNew);
  const [filterEspecie, setFilterEspecie] = useState("all");
  const [pesoVenta, setPesoVenta] = useState("");
  const [precioKilo, setPrecioKilo] = useState("");
  const [precioTotal, setPrecioTotal] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const { data: ventas = [], isLoading } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list("-fecha", 200) });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });

  // Cálculo automático
  const calcTotal = pesoVenta && precioKilo ? parseFloat(pesoVenta) * parseFloat(precioKilo) : null;
  const calcKilo = pesoVenta && precioTotal && !precioKilo ? Math.round(parseFloat(precioTotal) / parseFloat(pesoVenta)) : null;

  // Auto-calcular precio total = peso × precio/kilo
  useEffect(() => {
    if (pesoVenta && precioKilo && parseFloat(pesoVenta) > 0 && parseFloat(precioKilo) > 0) {
      setPrecioTotal(Math.round(parseFloat(pesoVenta) * parseFloat(precioKilo)).toString());
    }
  }, [pesoVenta, precioKilo]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const venta = await base44.entities.Venta.create(data);
      if (data.animal_id) {
        await base44.entities.Animal.update(data.animal_id, { estado: "vendido" });
      }
      return venta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      setDialogOpen(false);
      if (isNew) navigate("/ventas");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {};
    for (const [key, value] of fd.entries()) {
      if (value !== "") {
        if (key === "peso_venta") {
          data[key] = parseFloat(value);
        } else if (["precio_kilo", "precio_total", "costo_transporte", "comision", "otros_descuentos"].includes(key)) {
          data[key] = parseMoney(value);
        } else {
          data[key] = value;
        }
      }
    }
    if (!data.precio_total && calcTotal) data.precio_total = calcTotal;
    if (!data.precio_kilo && calcKilo) data.precio_kilo = calcKilo;
    const animal = animals.find(a => a.id === data.animal_id);
    if (animal) { data.finca_id = animal.finca_id; data.lote_id = animal.lote_id; }
    createMutation.mutate(data);
  };

  const handleImportVentas = async (rows) => {
    const nuevos = rows.map((r) => ({
      fecha: r.fecha, especie: r.especie || "bovino", comprador: r.comprador,
      peso_venta: parseFloat(r.peso_venta) || undefined,
      precio_kilo: parseMoney(r.precio_kilo) || undefined,
      precio_total: parseMoney(r.precio_total) || undefined,
    })).filter((r) => r.fecha && r.especie);
    if (nuevos.length) await base44.entities.Venta.bulkCreate(nuevos);
    queryClient.invalidateQueries({ queryKey: ["ventas"] });
  };

  const filtered = useMemo(() => ventas.filter(v => {
    if (filterEspecie !== "all" && v.especie !== filterEspecie) return false;
    return true;
  }), [ventas, filterEspecie]);

  const totalVentas = filtered.reduce((s, v) => s + (v.precio_total || 0), 0);
  const animalMap = {};
  animals.forEach(a => { animalMap[a.id] = a; });

  return (
    <div>
      <PageHeader title="Ventas" subtitle={`Total: ${formatCurrency(totalVentas)}`}>
        <CsvExportButton data={filtered} filename="ventas" columns={[
          { key: "fecha", label: "Fecha" }, { key: "especie", label: "Especie/Tipo" },
          { key: "comprador", label: "Comprador" }, { key: "peso_venta", label: "Peso (kg)" },
          { key: "precio_kilo", label: "Precio/kilo" }, { key: "precio_total", label: "Total" },
          { key: "costo_transporte", label: "Transporte" }, { key: "comision", label: "Comisión" },
        ]} />
        <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => setImportOpen(true)}><Layers className="w-4 h-4" /> Importar</Button>
        <Link to="/ventas/masiva">
          <Button variant="outline" className="gap-2"><Layers className="w-4 h-4" /> Venta Masiva</Button>
        </Link>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> Nueva Venta</Button>
      </PageHeader>

      {/* Filtro especie */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "all", label: "Todas" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
          { key: "semen_equino", label: "💉 Semen" },
        ].map(e => (
          <button key={e.key} onClick={() => setFilterEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={ShoppingCart} title="Sin ventas" description="Registra tu primera venta" actionLabel="Nueva Venta" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map(v => {
            const animal = animalMap[v.animal_id];
            return (
              <Card key={v.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {animal ? (
                          <Link to={`/animales/${v.animal_id}`} className="font-medium hover:underline">#{animal.numero}</Link>
                        ) : (
                          <span className="font-medium">{TIPO_VENTA[v.especie] || v.especie || "Venta"}</span>
                        )}
                        {v.especie && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ESPECIE_COLORS[v.especie] || "bg-gray-100 text-gray-600"}`}>
                            {TIPO_VENTA[v.especie] || v.especie}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {v.fecha ? format(new Date(v.fecha), "dd MMM yyyy", { locale: es }) : ""}
                        {v.peso_venta && ` • ${formatWeight(v.peso_venta)}`}
                        {v.comprador && ` • ${v.comprador}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-lg">{formatCurrency(v.precio_total)}</p>
                    <DeleteConfirmButton
                      entityName="Venta"
                      recordId={v.id}
                      recordLabel="esta venta"
                      warningText="Si esta venta fue creada por error, al eliminarla el animal seguirá marcado como vendido. Debes cambiar manualmente el estado del animal a Activo si corresponde."
                      queryKeysToInvalidate={["ventas", "animals"]}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open && isNew) navigate("/ventas"); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Nueva Venta</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Especie / Tipo de venta *</Label>
              <Select name="especie" required defaultValue="bovino">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_VENTA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Animal (si aplica)</Label>
              <Select name="animal_id" defaultValue={preAnimal || ""}>
                <SelectTrigger><SelectValue placeholder="Seleccionar animal" /></SelectTrigger>
                <SelectContent>
                  {animals.filter(a => a.estado === "activo").map(a => (
                    <SelectItem key={a.id} value={a.id}>#{a.numero} {a.nombre ? `(${a.nombre})` : ""} {a.ultimo_peso ? `- ${a.ultimo_peso} kg` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input name="fecha" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Peso al vender (kg)</Label>
                <Input name="peso_venta" type="number" step="0.1" value={pesoVenta} onChange={e => setPesoVenta(e.target.value)} placeholder="Ej: 450" />
              </div>
              <div>
                <Label>Precio por kilo</Label>
                <MoneyInput name="precio_kilo" value={precioKilo} onChange={setPrecioKilo} placeholder="Ej: 7500" />
              </div>
            </div>
            {calcTotal != null && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <p className="text-sm text-emerald-700">Precio total calculado automáticamente</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(calcTotal)}</p>
              </div>
            )}
            <div>
              <Label>Precio total de venta (auto)</Label>
              <MoneyInput name="precio_total" value={precioTotal} onChange={setPrecioTotal} placeholder={calcTotal ? calcTotal.toString() : "Ej: 3.375.000"} className={calcTotal != null ? "border-emerald-400 bg-emerald-50" : ""} />
              {calcTotal != null && <p className="text-xs text-emerald-600 mt-0.5">✓ Calculado automáticamente (peso × precio/kilo). Puedes ajustarlo si es necesario.</p>}
            </div>
            <div>
              <Label>Comprador</Label>
              <Input name="comprador" placeholder="Nombre del comprador" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Transporte</Label><MoneyInput name="costo_transporte" placeholder="0" /></div>
              <div><Label>Comisión</Label><MoneyInput name="comision" placeholder="0" /></div>
              <div><Label>Otros</Label><MoneyInput name="otros_descuentos" placeholder="0" /></div>
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="observaciones" />
            </div>
            <Button type="submit" className="w-full h-12" disabled={createMutation.isPending}>
              Registrar Venta
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} fields={[
        { key: "fecha", label: "Fecha (YYYY-MM-DD)", required: true },
        { key: "especie", label: "Especie (bovino/ovino/equino)", required: true },
        { key: "comprador", label: "Comprador" },
        { key: "peso_venta", label: "Peso venta (kg)" },
        { key: "precio_kilo", label: "Precio/kilo" },
        { key: "precio_total", label: "Precio total" },
      ]} onImport={handleImportVentas} entityLabel="ventas" />
    </div>
  );
}