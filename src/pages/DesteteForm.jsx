import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { calcEdadDestete } from "@/lib/caballos";
import { getTerminologia } from "@/lib/reproduccion";
import { toast } from "sonner";

export default function DesteteForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const madreIdParam = searchParams.get("madre_id");

  const especie = searchParams.get("especie") || "equino";
  const T = getTerminologia(especie);
  const esEquino = especie === "equino";

  const { data: crias = [] } = useQuery({
    queryKey: ["crias"],
    queryFn: () => base44.entities.Cria.list(),
  });

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

  const [formData, setFormData] = useState({
    cria_id: "",
    fecha_destete: new Date().toISOString().split("T")[0],
    nuevo_estado_yegua: "descanso",
    observaciones: "",
  });

  // Filtrar crías lactantes (candidatas a destete)
  const criasLactantes = crias.filter(c => c.estado === "lactante");

  // Si viene madre_id, mostrar solo las crías de esa madre (yegua o animal)
  const criasFiltradas = madreIdParam
    ? criasLactantes.filter(c => c.madre_id === madreIdParam)
    : criasLactantes;

  const criaSeleccionada = crias.find(c => c.id === formData.cria_id);
  // Para equinos la madre es una Yegua; para bovinos/ovinos la madre es un Animal
  const madreMadre = esEquino
    ? (criaSeleccionada ? yeguas.find(y => y.id === criaSeleccionada.madre_id) : null)
    : (criaSeleccionada ? animales.find(a => a.id === criaSeleccionada.madre_id) : null);

  const edadDestete = criaSeleccionada?.fecha_nacimiento && formData.fecha_destete
    ? calcEdadDestete(criaSeleccionada.fecha_nacimiento, formData.fecha_destete)
    : null;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const cria = crias.find(c => c.id === data.cria_id);
      if (!cria) throw new Error("Cría no encontrada");

      // Actualizar la cría a "destetada"
      await base44.entities.Cria.update(data.cria_id, {
        estado: "destetada",
        fecha_destete: data.fecha_destete,
        edad_destete_dias: edadDestete,
      });

      // Actualizar la madre
      if (cria.madre_id) {
        if (esEquino) {
          await base44.entities.Yegua.update(cria.madre_id, {
            estado_reproductivo: data.nuevo_estado_yegua,
            cria_actual_id: null,
          });
        } else {
          await base44.entities.Animal.update(cria.madre_id, {
            // El animal no tiene un campo de estado reproductivo dedicado; actualizamos observaciones
            observaciones: (animales.find(a => a.id === cria.madre_id)?.observaciones || "") +
              `\nCría destetada el ${data.fecha_destete}.`,
          }).catch(() => {});
        }
      }

      return { cria, edadDestete };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crias"] });
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      toast.success(`${T.desteteExito} Cría destetada a los ${edadDestete} días.`);
      navigate(madreIdParam ? (esEquino ? `/caballos/yeguas/${madreIdParam}` : `/animales/${madreIdParam}`) : (esEquino ? "/caballos/crias" : "/reproduccion"));
    },
    onError: (error) => {
      toast.error("Error: " + (error.message || "intente nuevamente"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cria_id) {
      toast.error(T.toastCria);
      return;
    }
    if (!formData.fecha_destete) {
      toast.error("La fecha de destete es obligatoria");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={T.desteteTitulo} subtitle={T.desteteSubtitulo}>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <Card className="p-6 space-y-4">
          <div>
            <Label>Cría a destetar *</Label>
            <Select
              value={formData.cria_id}
              onValueChange={(v) => setFormData({ ...formData, cria_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={T.criaPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {criasFiltradas.map(c => {
                  const madre = esEquino
                    ? yeguas.find(y => y.id === c.madre_id)
                    : animales.find(a => a.id === c.madre_id);
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre || "Sin nombre"} - Madre: {madre?.nombre || madre?.numero || "?"} ({c.fecha_nacimiento})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {criasFiltradas.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">No hay crías lactantes para destetar</p>
            )}
          </div>

          {criaSeleccionada && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cría:</span>
                <span className="font-medium">{criaSeleccionada.nombre || "Sin nombre"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Madre:</span>
                <span className="font-medium">{madreMadre?.nombre || madreMadre?.numero || "?"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nacimiento:</span>
                <span className="font-medium">{criaSeleccionada.fecha_nacimiento}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="fecha_destete">Fecha de destete *</Label>
            <Input
              id="fecha_destete"
              type="date"
              value={formData.fecha_destete}
              onChange={(e) => setFormData({ ...formData, fecha_destete: e.target.value })}
              required
            />
          </div>

          {edadDestete !== null && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <span className="text-muted-foreground">Edad al destete (calculada):</span>
              <span className="font-semibold ml-2 text-blue-700">{edadDestete} días ({(edadDestete / 30).toFixed(1)} meses)</span>
            </div>
          )}

          {esEquino && (
            <div>
              <Label>{T.estadoMadreLabel}</Label>
              <Select
                value={formData.nuevo_estado_yegua}
                onValueChange={(v) => setFormData({ ...formData, nuevo_estado_yegua: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="descanso">En descanso</SelectItem>
                  <SelectItem value="vacia">Vacía</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
          <Button type="submit" disabled={saveMutation.isPending || !formData.cria_id} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Guardando..." : "Registrar destete"}
          </Button>
        </div>
      </form>
    </div>
  );
}