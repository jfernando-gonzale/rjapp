import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const RAZAS = [
  { value: "criollo", label: "Criollo" },
  { value: "apalusa", label: "Apalusa" },
  { value: "cuarto_de_milla", label: "Cuarto de Milla" },
  { value: "pinto_americano", label: "Pinto Americano" },
  { value: "pura_sangre_espanol", label: "Pura Sangre Español" },
  { value: "pura_sangre_lusitano", label: "Pura Sangre Lusitano" },
  { value: "otra", label: "Otra" },
];

const empty = { nombre: "", numero: "", raza: "criollo", registro: "", color: "", fecha_nacimiento: "", edad_aproximada: "", finca_id: "", ubicacion: "", estado: "activo", tipo: "propio", observaciones: "" };

export default function ReproductorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(empty);
  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target ? e.target.value : e }));

  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });

  const { data: existing } = useQuery({
    queryKey: ["reproductor", id],
    queryFn: () => base44.entities.Reproductor.get(id),
    enabled: isEdit,
  });

  useEffect(() => { if (existing) setForm({ ...empty, ...existing }); }, [existing]);

  const save = useMutation({
    mutationFn: (data) => isEdit ? base44.entities.Reproductor.update(id, data) : base44.entities.Reproductor.create(data),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["reproductores"] });
      toast({ title: isEdit ? "Reproductor actualizado" : "Reproductor creado" });
      navigate(`/reproductores/${saved.id || id}`);
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Button>
      <h1 className="text-2xl font-heading font-bold mb-6">{isEdit ? "Editar Reproductor" : "Nuevo Reproductor"}</h1>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Nombre del reproductor *</Label>
            <Input value={form.nombre} onChange={set("nombre")} placeholder="Ej: Campeón del Sur" required />
          </div>
          <div>
            <Label>Número / identificación</Label>
            <Input value={form.numero} onChange={set("numero")} placeholder="Ej: REP-001" />
          </div>
          <div>
            <Label>Raza *</Label>
            <Select value={form.raza} onValueChange={set("raza")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RAZAS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Registro (opcional)</Label>
            <Input value={form.registro} onChange={set("registro")} placeholder="N° de registro oficial" />
          </div>
          <div>
            <Label>Color</Label>
            <Input value={form.color} onChange={set("color")} placeholder="Ej: Alazán tostado" />
          </div>
          <div>
            <Label>Fecha de nacimiento</Label>
            <Input type="date" value={form.fecha_nacimiento} onChange={set("fecha_nacimiento")} />
          </div>
          <div>
            <Label>Edad aproximada</Label>
            <Input value={form.edad_aproximada} onChange={set("edad_aproximada")} placeholder="Ej: 7 años" />
          </div>
          <div>
            <Label>Finca</Label>
            <Select value={form.finca_id} onValueChange={set("finca_id")}>
              <SelectTrigger><SelectValue placeholder="Seleccionar finca" /></SelectTrigger>
              <SelectContent>
                {fincas.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Potrero / Ubicación</Label>
            <Input value={form.ubicacion} onChange={set("ubicacion")} placeholder="Ej: Potrero norte" />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={set("estado")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="retirado">Retirado</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="muerto">Muerto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={set("tipo")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="propio">Reproductor propio</SelectItem>
                <SelectItem value="externo">Reproductor externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={set("observaciones")} rows={3} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
            onClick={() => save.mutate(form)}
            disabled={!form.nombre || !form.raza || save.isPending}
          >
            <Check className="w-4 h-4" />
            {save.isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear Reproductor"}
          </Button>
        </div>
      </Card>
    </div>
  );
}