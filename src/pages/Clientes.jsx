import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Phone, MapPin, User, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = { nombre: "", telefono: "", ciudad: "", departamento: "", finca_criadero: "", observaciones: "" };

export default function Clientes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list("-created_date"),
  });

  const save = useMutation({
    mutationFn: async (data) => {
      if (editing) return base44.entities.Cliente.update(editing, data);
      return base44.entities.Cliente.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
      toast({ title: editing ? "Cliente actualizado" : "Cliente registrado" });
    },
  });

  const filtered = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.ciudad?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(emptyForm); setEditing(null); setOpen(true); };
  const openEdit = (c) => { setForm({ ...c }); setEditing(c.id); setOpen(true); };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" subtitle="Gestión de clientes de semen y animales" actionLabel="Nuevo Cliente" onAction={openNew} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No hay clientes registrados</p>
          <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Registrar primer cliente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => openEdit(c)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{c.nombre}</h3>
                  {c.telefono && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {c.telefono}
                    </p>
                  )}
                  {(c.ciudad || c.departamento) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {[c.ciudad, c.departamento].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {c.finca_criadero && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{c.finca_criadero}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del cliente" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="Ej: 3001234567" />
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} placeholder="Ciudad" />
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <Input value={form.departamento} onChange={e => setForm(p => ({ ...p, departamento: e.target.value }))} placeholder="Departamento" />
              </div>
              <div className="space-y-1.5">
                <Label>Finca / Criadero</Label>
                <Input value={form.finca_criadero} onChange={e => setForm(p => ({ ...p, finca_criadero: e.target.value }))} placeholder="Nombre del criadero" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} placeholder="Notas adicionales..." rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => save.mutate(form)}
                disabled={!form.nombre || save.isPending}
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