import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { CATEGORIAS, FRECUENCIA_LABELS, ESPECIE_LABELS } from "@/lib/calendario";

export default function EventoCalendarioForm({ open, onOpenChange, initialValues, onSubmit, fincas = [], lotes = [], animales = [] }) {
  const [form, setForm] = useState({
    titulo: "",
    tipo_evento: "tarea",
    especie: "general",
    finca_id: "",
    lote_id: "",
    animal_id: "",
    fecha: new Date().toISOString().split("T")[0],
    hora: "",
    frecuencia: "no_repite",
    intervalo_dias: "",
    observaciones: "",
    estado: "pendiente",
  });

  useEffect(() => {
    if (open) {
      setForm({
        titulo: initialValues?.titulo || "",
        tipo_evento: initialValues?.tipo_evento || "tarea",
        especie: initialValues?.especie || "general",
        finca_id: initialValues?.finca_id || "",
        lote_id: initialValues?.lote_id || "",
        animal_id: initialValues?.animal_id || "",
        fecha: initialValues?.fecha || new Date().toISOString().split("T")[0],
        hora: initialValues?.hora || "",
        frecuencia: initialValues?.frecuencia || "no_repite",
        intervalo_dias: initialValues?.intervalo_dias || "",
        observaciones: initialValues?.observaciones || "",
        estado: initialValues?.estado || "pendiente",
      });
    }
  }, [open, initialValues]);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.fecha) {
      toast({ title: "Faltan datos", description: "Título y fecha son obligatorios." });
      return;
    }
    const payload = {
      ...form,
      es_recurrente: form.frecuencia && form.frecuencia !== "no_repite",
      intervalo_dias: form.intervalo_dias ? Number(form.intervalo_dias) : undefined,
    };
    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {initialValues?.id ? "Editar evento" : "Nuevo evento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} required />
          </div>
          <div>
            <Label>Tipo de evento</Label>
            <Select value={form.tipo_evento} onValueChange={(v) => set("tipo_evento", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIAS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Especie</Label>
            <Select value={form.especie} onValueChange={(v) => set("especie", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ESPECIE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Finca</Label>
            <Select value={form.finca_id} onValueChange={(v) => set("finca_id", v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Lote / Potrero</Label>
            <Select value={form.lote_id} onValueChange={(v) => set("lote_id", v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {lotes.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Animal</Label>
            <Select value={form.animal_id} onValueChange={(v) => set("animal_id", v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {animales.map((a) => <SelectItem key={a.id} value={a.id}>#{a.numero}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} required />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Repetición</Label>
            <Select value={form.frecuencia} onValueChange={(v) => set("frecuencia", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FRECUENCIA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.frecuencia === "personalizado" && (
            <div>
              <Label>Intervalo (días)</Label>
              <Input type="number" value={form.intervalo_dias} onChange={(e) => set("intervalo_dias", e.target.value)} placeholder="Ej: 45" />
            </div>
          )}
          <div>
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="reprogramado">Reprogramado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
          </div>
          <Button type="submit" className="w-full h-12">Guardar evento</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}