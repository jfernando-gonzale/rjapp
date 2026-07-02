import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Trash2, Download, Copy } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { formatCurrency, TIPO_VENTA } from "@/lib/helpers";
import { exportToCsv } from "@/lib/csv";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTADO_PROFORMA = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  facturada: "Facturada",
};
const ESTADO_THEME = {
  borrador: "gray",
  enviada: "blue",
  aceptada: "green",
  rechazada: "red",
  facturada: "yellow",
};

const emptyItem = { animal_id: "", numero: "", peso: "", precio_kilo: "", subtotal: 0 };

export default function Proformas() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cliente_id: "",
    cliente_nombre: "",
    especie: "bovino",
    descuento: 0,
    validez_dias: 15,
    observaciones: "",
    estado: "borrador",
  });
  const [items, setItems] = useState([{ ...emptyItem }]);

  const { data: proformas = [], isLoading } = useQuery({ queryKey: ["proformas"], queryFn: () => base44.entities.Proforma.list("-fecha", 200) });
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: () => base44.entities.Cliente.list() });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  const animalMap = useMemo(() => {
    const m = {};
    animals.forEach((a) => { m[a.id] = a; });
    return m;
  }, [animals]);

  const subtotal = items.reduce((s, it) => s + (it.subtotal || 0), 0);
  const total = Math.max(0, subtotal - (parseFloat(form.descuento) || 0));

  const nextNumero = `PRO-${String(proformas.length + 1).padStart(4, "0")}`;

  const save = useMutation({
    mutationFn: async (data) => {
      if (editing) return base44.entities.Proforma.update(editing, data);
      return base44.entities.Proforma.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proformas"] });
      setOpen(false);
      setEditing(null);
    },
  });

  const openNew = () => {
    setForm({
      fecha: new Date().toISOString().split("T")[0],
      cliente_id: "", cliente_nombre: "", especie: "bovino",
      descuento: 0, validez_dias: 15, observaciones: "", estado: "borrador",
    });
    setItems([{ ...emptyItem }]);
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (p) => {
    const parsed = p.items_json ? JSON.parse(p.items_json) : [];
    setForm({
      fecha: p.fecha || new Date().toISOString().split("T")[0],
      cliente_id: p.cliente_id || "",
      cliente_nombre: p.cliente_nombre || "",
      especie: p.especie || "bovino",
      descuento: p.descuento || 0,
      validez_dias: p.validez_dias || 15,
      observaciones: p.observaciones || "",
      estado: p.estado || "borrador",
    });
    setItems(parsed.length > 0 ? parsed : [{ ...emptyItem }]);
    setEditing(p.id);
    setOpen(true);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, [field]: value };
      if (field === "animal_id") {
        const a = animalMap[value];
        if (a) {
          next.numero = a.numero;
          next.peso = a.ultimo_peso || "";
        }
      }
      if (field === "animal_id" && !value) next.numero = "";
      const peso = parseFloat(next.peso) || 0;
      const kilo = parseFloat(next.precio_kilo) || 0;
      next.subtotal = Math.round(peso * kilo);
      return next;
    }));
  };

  const recomputeSubtotal = (idx) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const peso = parseFloat(it.peso) || 0;
      const kilo = parseFloat(it.precio_kilo) || 0;
      return { ...it, subtotal: Math.round(peso * kilo) };
    }));
  };

  const handleSubmit = () => {
    const cleanItems = items.filter((it) => it.numero || it.animal_id || it.subtotal > 0);
    const payload = {
      fecha: form.fecha,
      cliente_id: form.cliente_id || undefined,
      cliente_nombre: form.cliente_nombre || undefined,
      especie: form.especie,
      items_json: JSON.stringify(cleanItems),
      subtotal,
      descuento: parseFloat(form.descuento) || 0,
      total,
      estado: form.estado,
      validez_dias: parseInt(form.validez_dias) || 15,
      observaciones: form.observaciones || undefined,
    };
    if (!editing) payload.numero = nextNumero;
    save.mutate(payload);
  };

  const changeEstado = (p, estado) => {
    base44.entities.Proforma.update(p.id, { estado }).then(() => qc.invalidateQueries({ queryKey: ["proformas"] }));
  };

  const exportProforma = (p) => {
    const parsed = p.items_json ? JSON.parse(p.items_json) : [];
    const rows = parsed.map((it) => ({
      Proforma: p.numero,
      Fecha: p.fecha,
      Cliente: p.cliente_nombre || "",
      Item: it.numero || "",
      Peso_kg: it.peso || "",
      Precio_kilo: it.precio_kilo || "",
      Subtotal: it.subtotal || 0,
    }));
    rows.push({ Proforma: "", Fecha: "", Cliente: "", Item: "SUBTOTAL", Peso_kg: "", Precio_kilo: "", Subtotal: p.subtotal || 0 });
    if (p.descuento) rows.push({ Proforma: "", Fecha: "", Cliente: "", Item: "DESCUENTO", Peso_kg: "", Precio_kilo: "", Subtotal: -(p.descuento) });
    rows.push({ Proforma: "", Fecha: "", Cliente: "", Item: "TOTAL", Peso_kg: "", Precio_kilo: "", Subtotal: p.total || 0 });
    exportToCsv(`${p.numero}.csv`, rows);
  };

  const duplicate = (p) => {
    const parsed = p.items_json ? JSON.parse(p.items_json) : [];
    setForm({
      fecha: new Date().toISOString().split("T")[0],
      cliente_id: p.cliente_id || "", cliente_nombre: p.cliente_nombre || "",
      especie: p.especie || "bovino", descuento: p.descuento || 0,
      validez_dias: p.validez_dias || 15, observaciones: p.observaciones || "", estado: "borrador",
    });
    setItems(parsed.length > 0 ? parsed : [{ ...emptyItem }]);
    setEditing(null);
    setOpen(true);
  };

  return (
    <div>
      <PageHeader title="Proformas / Prefacturas" subtitle={`${proformas.length} proformas`} actionLabel="Nueva Proforma" onAction={openNew} />

      {proformas.length === 0 && !isLoading ? (
        <EmptyState icon={FileText} title="Sin proformas" description="Crea tu primera proforma o prefactura" actionLabel="Nueva Proforma" onAction={openNew} />
      ) : (
        <div className="space-y-3">
          {proformas.map((p) => {
            const itemCount = p.items_json ? JSON.parse(p.items_json).length : 0;
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{p.numero}</p>
                        <StatusBadge status={p.estado} label={ESTADO_PROFORMA[p.estado]} color={ESTADO_THEME[p.estado]} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.fecha ? format(new Date(p.fecha), "dd MMM yyyy", { locale: es }) : ""}
                        {p.cliente_nombre ? ` • ${p.cliente_nombre}` : ""}
                        {itemCount > 0 ? ` • ${itemCount} ítem${itemCount > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-lg">{formatCurrency(p.total || 0)}</p>
                    <Select value={p.estado} onValueChange={(v) => changeEstado(p, v)}>
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ESTADO_PROFORMA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => exportProforma(p)} title="Exportar CSV"><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(p)} title="Duplicar"><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Editar"><FileText className="w-4 h-4" /></Button>
                    <DeleteConfirmButton entityName="Proforma" recordId={p.id} recordLabel={`la proforma ${p.numero}`} queryKeysToInvalidate={["proformas"]} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar Proforma" : `Nueva Proforma ${nextNumero}`}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={form.cliente_id} onValueChange={(v) => {
                  const c = clientes.find((x) => x.id === v);
                  setForm((p) => ({ ...p, cliente_id: v, cliente_nombre: c?.nombre || p.cliente_nombre }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente (texto libre)</Label>
                <Input value={form.cliente_nombre} onChange={(e) => setForm((p) => ({ ...p, cliente_nombre: e.target.value, cliente_id: "" }))} placeholder="Nombre del comprador" />
              </div>
              <div>
                <Label>Especie / Línea</Label>
                <Select value={form.especie} onValueChange={(v) => setForm((p) => ({ ...p, especie: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_VENTA).filter(([k]) => ["bovino", "ovino", "equino", "general"].includes(k)).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items de la proforma</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1 h-7" onClick={() => setItems((p) => [...p, { ...emptyItem }])}><Plus className="w-3.5 h-3.5" /> Agregar</Button>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-medium">Animal</th>
                      <th className="text-left px-2 py-1.5 font-medium">N°</th>
                      <th className="text-right px-2 py-1.5 font-medium">Peso (kg)</th>
                      <th className="text-right px-2 py-1.5 font-medium">$/Kilo</th>
                      <th className="text-right px-2 py-1.5 font-medium">Subtotal</th>
                      <th className="px-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-1">
                          <Select value={it.animal_id} onValueChange={(v) => updateItem(idx, "animal_id", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {animals.filter((a) => a.estado === "activo" && (form.especie === "general" || a.especie === form.especie)).map((a) => (
                                <SelectItem key={a.id} value={a.id}>#{a.numero} {a.ultimo_peso ? `${a.ultimo_peso}kg` : ""}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1"><Input className="h-8 text-xs" value={it.numero} onChange={(e) => updateItem(idx, "numero", e.target.value)} placeholder="N°" /></td>
                        <td className="px-2 py-1"><Input className="h-8 text-xs text-right" type="number" step="0.1" value={it.peso} onChange={(e) => updateItem(idx, "peso", e.target.value)} onBlur={() => recomputeSubtotal(idx)} placeholder="0" /></td>
                        <td className="px-2 py-1"><Input className="h-8 text-xs text-right" type="number" value={it.precio_kilo} onChange={(e) => updateItem(idx, "precio_kilo", e.target.value)} onBlur={() => recomputeSubtotal(idx)} placeholder="0" /></td>
                        <td className="px-2 py-1 text-right font-medium">{formatCurrency(it.subtotal || 0)}</td>
                        <td className="px-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Descuento</Label>
                <Input type="number" value={form.descuento} onChange={(e) => setForm((p) => ({ ...p, descuento: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Validez (días)</Label>
                <Input type="number" value={form.validez_dias} onChange={(e) => setForm((p) => ({ ...p, validez_dias: e.target.value }))} />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm((p) => ({ ...p, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_PROFORMA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700">Subtotal: {formatCurrency(subtotal)}</p>
                {parseFloat(form.descuento) > 0 && <p className="text-xs text-red-600">Descuento: -{formatCurrency(parseFloat(form.descuento) || 0)}</p>}
              </div>
              <p className="text-2xl font-bold text-amber-700">Total: {formatCurrency(total)}</p>
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea value={form.observaciones} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))} rows={2} placeholder="Notas, condiciones de pago, etc." />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="gap-2" onClick={handleSubmit} disabled={save.isPending}>
                {save.isPending ? "Guardando..." : editing ? "Actualizar Proforma" : "Crear Proforma"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}