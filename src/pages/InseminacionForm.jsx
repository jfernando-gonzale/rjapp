import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { TIPO_INSEMINACION, RESULTADO_INSEMINACION } from "@/lib/caballos";
import { getTerminologia } from "@/lib/reproduccion";
import { toast } from "sonner";

export default function InseminacionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const yeguaIdParam = searchParams.get("yegua_id");

  // Especie: equino por defecto, pero puede ser bovino u ovino si viene ?especie=
  const especie = searchParams.get("especie") || "equino";
  const T = getTerminologia(especie);

  // Para equinos usamos la entidad Yegua; para bovinos/ovinos usamos Animal (hembras activas de la especie)
  const esEquino = especie === "equino";

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
    enabled: esEquino,
  });

  const { data: animales = [] } = useQuery({
    queryKey: ["animals"],
    queryFn: () => base44.entities.Animal.list(),
    enabled: !esEquino,
  });

  // Hembras de la especie (macho=false/hembra o sin sexo) en estado activo
  const hembrasEspecie = esEquino ? [] : animales.filter(a =>
    a.especie === especie &&
    a.estado === "activo" &&
    (a.sexo === "hembra" || !a.sexo)
  );

  const hembras = esEquino ? yeguas : hembrasEspecie;

  const [formData, setFormData] = useState({
    yegua_id: yeguaIdParam || "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "monta_natural",
    reproductor: "",
    responsable: "",
    resultado: "pendiente",
    observaciones: "",
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Crear la inseminación
      const inseminacion = await base44.entities.Inseminacion.create(data);

      // Actualizar estado según especie
      if (esEquino) {
        await base44.entities.Yegua.update(data.yegua_id, {
          estado_reproductivo: "inseminada",
          fecha_ultima_inseminacion: data.fecha,
          repeticiones_celo: 0,
        });
      } else {
        // Bovinos/Ovinos: guardamos en el animal una marca simple (sin cambiar campos de yegua)
        // El animal no tiene estado reproductivo dedicado, así que solo se crea el registro.
        await base44.entities.Animal.update(data.yegua_id, {
          observaciones: (animales.find(a => a.id === data.yegua_id)?.observaciones || "") +
            `\nInseminación el ${data.fecha}: ${data.resultado}`,
        }).catch(() => {});
      }

      return inseminacion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["inseminaciones"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      toast.success(T.inseminacionExito);
      navigate(yeguaIdParam ? (esEquino ? `/caballos/yeguas/${yeguaIdParam}` : `/animales/${yeguaIdParam}`) : "/reproduccion");
    },
    onError: (error) => {
      toast.error("Error: " + (error.message || "intente nuevamente"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.yegua_id) {
      toast.error(T.toastHembra);
      return;
    }
    if (!formData.fecha) {
      toast.error("La fecha es obligatoria");
      return;
    }
    const dataToSave = { ...formData };
    if (!dataToSave.reproductor) delete dataToSave.reproductor;
    if (!dataToSave.responsable) delete dataToSave.responsable;
    saveMutation.mutate(dataToSave);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={T.inseminacionTitulo} subtitle={T.inseminacionSubtitulo}>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <Card className="p-6 space-y-4">
          <div>
            <Label>{T.hembra} *</Label>
            <Select
              value={formData.yegua_id}
              onValueChange={(v) => setFormData({ ...formData, yegua_id: v })}
              disabled={Boolean(yeguaIdParam)}
            >
              <SelectTrigger>
                <SelectValue placeholder={T.hembraPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {hembras.map(h => (
                  <SelectItem key={h.id} value={h.id}>{h.nombre || h.numero}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!esEquino && hembras.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">No hay {T.hembraPlural} registradas. Crea el animal primero.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_INSEMINACION).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reproductor">{T.macho}</Label>
              <Input
                id="reproductor"
                value={formData.reproductor}
                onChange={(e) => setFormData({ ...formData, reproductor: e.target.value })}
                placeholder={esEquino ? "Ej: Caballo 'Relámpago'" : "Ej: Toro 'Negro'"}
              />
            </div>
            <div>
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder="Ej: Carlos Pérez"
              />
            </div>
          </div>

          <div>
            <Label>Resultado</Label>
            <Select
              value={formData.resultado}
              onValueChange={(v) => setFormData({ ...formData, resultado: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Bovinos/Ovinos no usan "no_confirmado" → lo filtramos si no es equino */}
                {Object.entries(RESULTADO_INSEMINACION)
                  .filter(([key]) => esEquino ? true : key !== "no_confirmado")
                  .map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {esEquino && (
              <p className="text-xs text-muted-foreground mt-1">El estado de la yegua cambiará a "Inseminada" automáticamente</p>
            )}
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas..."
              className="resize-none"
              rows={3}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}