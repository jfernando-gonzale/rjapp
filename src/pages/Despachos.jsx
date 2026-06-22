import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Truck, MapPin, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const ESTADOS = ["programado", "enviado", "entregado", "cancelado", "con_novedad"];
const ESTADO_LABELS = { programado: "Programado", enviado: "Enviado", entregado: "Entregado", cancelado: "Cancelado", con_novedad: "Con novedad" };
const ESTADO_COLORS = {
  programado: "bg-amber-100 text-amber-800",
  enviado: "bg-blue-100 text-blue-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-gray-100 text-gray-600",
  con_novedad: "bg-red-100 text-red-800",
};

const emptyForm = {
  reproductor: "", fecha_despacho: "", cliente_id: "", ciudad_destino: "", departamento_destino: "",
  transportadora: "", numero_guia: "", numero_dosis: "", valor_cobrado: "", fecha_estimada_llegada: "",
  estado: "programado", observaciones: ""
};

export default function Despachos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  const { data: despachos = [] } = useQuery({
    queryKey: ["despachos"],
    queryFn: () => base44.entities.Despacho.list("-created_date"),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: reproductores = [] } = useQuery({
    queryKey: ["reproductores"],
    queryFn: () => base44.entities.Reproductor.list(),
  });

  const save = useMutation({
    mutationFn: async (data) => {
      const d = { ...data, numero_dosis: Number(data.numero_dosis) || 0, valor_cobrado: Number(data.valor_cobrado) || 0 };
      if (editing) return base44.entities.Despacho.update(editing, d);
      return base44.entities.Despacho.create(d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["despachos"] });
      setOpen(false); setForm(emptyForm); setEditing(null);
      toast({ title: "Despacho guardado" });
    },
  });

  const clienteNombre = (id) => clientes.find(c => c.id === id)?.nombre || id || "-";

  const filtered = despachos.filter(d => {
    const matchSearch = d.reproductor?.toLowerCase().includes(search.toLowerCase()) ||
      clienteNombre(d.cliente_id)?.toLowerCase().includes(search.toLowerCase()) ||
      d.ciudad_destino?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFilter === "todos" || d.estado === estadoFilter;
    return matchSearch && matchEstado;
  });

  const openNew = () => { setForm(emptyForm); setEditing(null); setOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader title="Despachos" subtitle="Control de envíos de semen fresco" actionLabel="Nuevo Despacho" onAction={openNew}>
        <Link to="/reproductores">
          <Button variant="outline" className="gap-2">Ver Reproductores</Button>
        </Link>
      </PageHeader>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar reproductor, cliente, ciudad..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Programados", value: despachos.filter(d => d.estado === "programado").length, color: "text-amber-600" },
          { label: "Enviados", value: despachos.filter(d => d.estado === "enviado").length, color: "text-blue-600" },
          { label: "Entregados", value: despachos.filter(d => d.estado === "entregado").length, color: "text-green-600" },
          { label: "Con novedad", value: despachos.filter(d => d.estado === "con_novedad").length, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No hay despachos registrados</p>
          <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Registrar primer despacho
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <Card key={d.id} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{d.reproductor || "Reproductor no especificado"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[d.estado] || "bg-gray-100 text-gray-600"}`}>
                        {ESTADO_LABELS[d.estado] || d.estado}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>Cliente: {clienteNombre(d.cliente_id)}</span>
                      {d.ciudad_destino && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.ciudad_destino}</span>}
                      {d.numero_dosis && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{d.numero_dosis} dosis</span>}
                      {d.fecha_despacho && <span>{d.fecha_despacho}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setForm({ ...d }); setEditing(d.id); setOpen(true); }}>
                  Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Despacho" : "Nuevo Despacho"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Reproductor *</Label>
                {reproductores.length > 0 ? (
                  <Select value={form.reproductor_id || ""} onValueChange={v => {
                    const rep = reproductores.find(r => r.id === v);
                    setForm(p => ({ ...p, reproductor_id: v, reproductor: rep?.nombre || "" }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar reproductor..." /></SelectTrigger>
                    <SelectContent>
                      {reproductores.filter(r => r.estado === "activo").map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input value={form.reproductor} onChange={e => setForm(p => ({ ...p, reproductor: e.target.value }))} placeholder="Nombre del reproductor" className="flex-1" />
                    <Link to="/reproductores/nuevo"><Button variant="outline" type="button" size="sm">+ Crear</Button></Link>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Fecha despacho *</Label>
                <Input type="date" value={form.fecha_despacho} onChange={e => setForm(p => ({ ...p, fecha_despacho: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select value={form.cliente_id} onValueChange={v => setForm(p => ({ ...p, cliente_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad destino</Label>
                <Input value={form.ciudad_destino} onChange={e => setForm(p => ({ ...p, ciudad_destino: e.target.value }))} placeholder="Ciudad" />
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <Input value={form.departamento_destino} onChange={e => setForm(p => ({ ...p, departamento_destino: e.target.value }))} placeholder="Departamento" />
              </div>
              <div className="space-y-1.5">
                <Label>N° de dosis</Label>
                <Input type="number" value={form.numero_dosis} onChange={e => setForm(p => ({ ...p, numero_dosis: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Valor cobrado ($)</Label>
                <Input type="number" value={form.valor_cobrado} onChange={e => setForm(p => ({ ...p, valor_cobrado: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Transportadora</Label>
                <Input value={form.transportadora} onChange={e => setForm(p => ({ ...p, transportadora: e.target.value }))} placeholder="Ej: Servientrega" />
              </div>
              <div className="space-y-1.5">
                <Label>Número de guía</Label>
                <Input value={form.numero_guia} onChange={e => setForm(p => ({ ...p, numero_guia: e.target.value }))} placeholder="Número de guía" />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha estimada llegada</Label>
                <Input type="date" value={form.fecha_estimada_llegada} onChange={e => setForm(p => ({ ...p, fecha_estimada_llegada: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(p => ({ ...p, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map(e => <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => save.mutate(form)}
                disabled={(!form.reproductor && !form.reproductor_id) || !form.fecha_despacho || save.isPending}
              >
                {save.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}