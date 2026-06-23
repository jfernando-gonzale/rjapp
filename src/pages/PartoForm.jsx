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
import { RESULTADO_PARTO, SEXO_CRIA } from "@/lib/caballos";
import { getTerminologia } from "@/lib/reproduccion";
import { toast } from "sonner";

export default function PartoForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const yeguaIdParam = searchParams.get("yegua_id");

  const especie = searchParams.get("especie") || "equino";
  const T = getTerminologia(especie);
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

  const hembrasEspecie = esEquino ? [] : animales.filter(a =>
    a.especie === especie && a.estado === "activo" && (a.sexo === "hembra" || !a.sexo)
  );
  const hembras = esEquino ? yeguas : hembrasEspecie;

  const [formData, setFormData] = useState({
    yegua_id: yeguaIdParam || "",
    fecha: new Date().toISOString().split("T")[0],
    resultado: "cria_viva",
    sexo_cria: "no_registrado",
    nombre_cria: "",
    color_cria: "",
    observaciones: "",
    // Campos para ovinos (camada)
    num_nacidos: "",
    num_vivos: "",
    num_muertos: "",
    tipo_parto: "simple",
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const parto = await base44.entities.Parto.create(data);

      let criaId = null;

      if (data.resultado === "cria_viva") {
        if (esEquino) {
          const yegua = yeguas.find(y => y.id === data.yegua_id);
          const cria = await base44.entities.Cria.create({
            nombre: data.nombre_cria || "",
            madre_id: data.yegua_id,
            finca_id: yegua?.finca_id || "",
            fecha_nacimiento: data.fecha,
            sexo: data.sexo_cria,
            color: data.color_cria || "",
            estado: "lactante",
            parto_id: parto.id,
          });
          criaId = cria.id;
          await base44.entities.Parto.update(parto.id, { cria_id: criaId });
        } else {
          // Bovinos/Ovinos: creamos una Cria con especie = animal de la madre, o marcamos al animal como parido
          const madre = animales.find(a => a.id === data.yegua_id);
          const cria = await base44.entities.Cria.create({
            nombre: data.nombre_cria || "",
            madre_id: data.yegua_id,
            finca_id: madre?.finca_id || "",
            fecha_nacimiento: data.fecha,
            sexo: data.sexo_cria,
            color: data.color_cria || "",
            estado: "lactante",
            parto_id: parto.id,
          });
          criaId = cria.id;
          await base44.entities.Parto.update(parto.id, { cria_id: criaId });
        }
      }

      if (esEquino) {
        const updateData = {
          estado_reproductivo: "parida",
          fecha_ultimo_parto: data.fecha,
          fecha_probable_parto: null,
          fecha_confirmacion_preñez: null,
          fecha_ultima_inseminacion: null,
          repeticiones_celo: 0,
        };
        if (criaId) updateData.cria_actual_id = criaId;
        await base44.entities.Yegua.update(data.yegua_id, updateData);
      } else {
        // Bovinos/Ovinos: actualizamos observaciones del animal
        await base44.entities.Animal.update(data.yegua_id, {
          observaciones: (animales.find(a => a.id === data.yegua_id)?.observaciones || "") +
            `\nParto el ${data.fecha}: ${data.resultado}.`,
        }).catch(() => {});
      }

      return parto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yeguas"] });
      queryClient.invalidateQueries({ queryKey: ["partos"] });
      queryClient.invalidateQueries({ queryKey: ["crias"] });
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      toast.success(T.partoExito);
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
      toast.error("La fecha del parto es obligatoria");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={T.partoTitulo} subtitle={T.partoSubtitulo}>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha del parto *</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Resultado del parto *</Label>
              <Select
                value={formData.resultado}
                onValueChange={(v) => setFormData({ ...formData, resultado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESULTADO_PARTO).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos para ovinos: camada */}
          {especie === "ovino" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Datos de la camada</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="num_nacidos">N° nacidos</Label>
                  <Input
                    id="num_nacidos"
                    type="number"
                    min="0"
                    value={formData.num_nacidos}
                    onChange={(e) => setFormData({ ...formData, num_nacidos: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="num_vivos">N° vivos</Label>
                  <Input
                    id="num_vivos"
                    type="number"
                    min="0"
                    value={formData.num_vivos}
                    onChange={(e) => setFormData({ ...formData, num_vivos: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="num_muertos">N° muertos</Label>
                  <Input
                    id="num_muertos"
                    type="number"
                    min="0"
                    value={formData.num_muertos}
                    onChange={(e) => setFormData({ ...formData, num_muertos: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Tipo de parto</Label>
                  <Select
                    value={formData.tipo_parto}
                    onValueChange={(v) => setFormData({ ...formData, tipo_parto: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="doble">Doble</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                      <SelectItem value="multiple">Múltiple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Datos de la cría - solo si es cría viva */}
          {formData.resultado === "cria_viva" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">
                Datos de la cría ({T.cria}) — se creará automáticamente
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sexo de la cría</Label>
                  <Select
                    value={formData.sexo_cria}
                    onValueChange={(v) => setFormData({ ...formData, sexo_cria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEXO_CRIA).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nombre_cria">{T.criaNombreLabel}</Label>
                  <Input
                    id="nombre_cria"
                    value={formData.nombre_cria}
                    onChange={(e) => setFormData({ ...formData, nombre_cria: e.target.value })}
                    placeholder={T.criaNombrePlaceholder}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color_cria">Color de la cría</Label>
                <Input
                  id="color_cria"
                  value={formData.color_cria}
                  onChange={(e) => setFormData({ ...formData, color_cria: e.target.value })}
                  placeholder={esEquino ? "Ej: Alazán" : "Ej: Negro, blanco"}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas del parto..."
              className="resize-none"
              rows={3}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Guardando..." : "Registrar parto"}
          </Button>
        </div>
      </form>
    </div>
  );
}