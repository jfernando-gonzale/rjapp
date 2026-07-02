import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { ESTADO_REPRODUCTIVO } from "@/lib/caballos";
import RazaEquinaSelect from "@/components/shared/RazaEquinaSelect";
import FechaNacimientoEdad from "@/components/shared/FechaNacimientoEdad";
import { toast } from "sonner";

export default function YeguaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: fincas = [] } = useQuery({
    queryKey: ["fincas"],
    queryFn: () => base44.entities.Finca.list(),
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ["lotes"],
    queryFn: () => base44.entities.Lote.list(),
  });

  const { data: yeguaExistente } = useQuery({
    queryKey: ["yegua", id],
    queryFn: () => base44.entities.Yegua.filter({ id }),
    enabled: isEdit,
  });

  const [formData, setFormData] = useState(() => {
    if (yeguaExistente && yeguaExistente.length > 0) {
      const y = yeguaExistente[0];
      return {
        nombre: y.nombre || "",
        numero: y.numero || "",
        finca_id: y.finca_id || "",
        lote_id: y.lote_id || "",
        raza: y.raza || "",
        color: y.color || "",
        fecha_nacimiento: y.fecha_nacimiento || "",
        edad_aproximada: y.edad_aproximada || "",
        estado_reproductivo: y.estado_reproductivo || "vacia",
        observaciones: y.observaciones || "",
      };
    }
    return {
      nombre: "",
      numero: "",
      finca_id: "",
      lote_id: "",
      raza: "",
      color: "",
      fecha_nacimiento: "",
      edad_aproximada: "",
      estado_reproductivo: "vacia",
      observaciones: "",
    };
  });

  const lotesFinca = lotes.filter(l => l.finca_id === formData.finca_id);

  // Actualizar formData cuando se carga la yegua existente
  useEffect(() => {
    if (yeguaExistente && yeguaExistente.length > 0 && isEdit) {
      const y = yeguaExistente[0];
      setFormData({
        nombre: y.nombre || "",
        numero: y.numero || "",
        finca_id: y.finca_id || "",
        lote_id: y.lote_id || "",
        raza: y.raza || "",
        color: y.color || "",
        fecha_nacimiento: y.fecha_nacimiento || "",
        edad_aproximada: y.edad_aproximada || "",
        estado_reproductivo: y.estado_reproductivo || "vacia",
        observaciones: y.observaciones || "",
      });
    }
  }, [yeguaExistente, isEdit]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = { ...data };
      if (isEdit) {
        return base44.entities.Yegua.update(id, cleanData);
      }
      return base44.entities.Yegua.create(cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["yegua", id] });
      toast.success(isEdit ? "Yegua actualizada" : "Yegua registrada");
      navigate("/caballos/yeguas");
    },
    onError: (error) => {
      toast.error("Error al guardar: " + (error.message || "intente nuevamente"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre?.trim()) {
      toast.error("El nombre o número es obligatorio");
      return;
    }
    const dataToSave = { ...formData };
    // Limpiar campos vacíos opcionales
    if (!dataToSave.lote_id) delete dataToSave.lote_id;
    if (!dataToSave.finca_id) delete dataToSave.finca_id;
    saveMutation.mutate(dataToSave);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? "Editar Yegua" : "Nueva Yegua"}
        subtitle="Registro simple de la yegua"
      >
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <Card className="p-6 space-y-4">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre o número *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Luna, Yegua 01"
                required
              />
            </div>
            <div>
              <Label htmlFor="numero">Número / Identificación</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Ej: 001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Estado reproductivo *</Label>
              <Select
                value={formData.estado_reproductivo}
                onValueChange={(v) => setFormData({ ...formData, estado_reproductivo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADO_REPRODUCTIVO).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FechaNacimientoEdad
              fechaNacimiento={formData.fecha_nacimiento}
              edad={formData.edad_aproximada}
              onChangeFecha={(v) => setFormData({ ...formData, fecha_nacimiento: v })}
              onChangeEdad={(v) => setFormData({ ...formData, edad_aproximada: v })}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Si conoces la fecha de nacimiento, la edad se calculará automáticamente. Si no la conoces, puedes escribir una edad aproximada.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Finca</Label>
              <Select
                value={formData.finca_id}
                onValueChange={(v) => setFormData({ ...formData, finca_id: v, lote_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar finca" />
                </SelectTrigger>
                <SelectContent>
                  {fincas.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote / Potrero</Label>
              <Select
                value={formData.lote_id}
                onValueChange={(v) => setFormData({ ...formData, lote_id: v })}
                disabled={!formData.finca_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {lotesFinca.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RazaEquinaSelect
              value={formData.raza}
              onChange={(v) => setFormData({ ...formData, raza: v })}
              label="Raza"
            />
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ej: Alazán, Bayo"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas generales..."
              className="resize-none"
              rows={3}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}