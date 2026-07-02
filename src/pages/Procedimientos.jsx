import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardList, Plus, Filter } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { formatCurrency, TIPO_PROCEDIMIENTO, PROCEDIMIENTOS_POR_ESPECIE } from "@/lib/helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESPECIE_COLORS = {
  bovino: "bg-amber-100 text-amber-800",
  ovino: "bg-green-100 text-green-800",
  equino: "bg-blue-100 text-blue-800",
};
const ESPECIE_LABELS = { bovino: "🐄 Bovino", ovino: "🐑 Ovino", equino: "🐴 Equino" };

export default function Procedimientos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const isNew = window.location.pathname.includes("/nuevo");
  const preAnimal = urlParams.get("animal");

  const [dialogOpen, setDialogOpen] = useState(isNew);
  const [tipoRegistro, setTipoRegistro] = useState("individual");
  const [formEspecie, setFormEspecie] = useState("bovino");
  const [filterEspecie, setFilterEspecie] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterFinca, setFilterFinca] = useState("all");
  const [filterLote, setFilterLote] = useState("all");
  const [filterResponsable, setFilterResponsable] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: procedimientos = [], isLoading } = useQuery({ queryKey: ["procedimientos"], queryFn: () => base44.entities.Procedimiento.list("-fecha", 300) });
  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Procedimiento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedimientos"] });
      setDialogOpen(false);
      if (isNew) navigate("/procedimientos");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { tipo_registro: tipoRegistro, especie: formEspecie };
    for (const [key, value] of fd.entries()) {
      if (value !== "") {
        if (["costo", "numero_animales"].includes(key)) data[key] = parseFloat(value);
        else data[key] = value;
      }
    }
    createMutation.mutate(data);
  };

  const animalMap = {};
  animals.forEach((a) => { animalMap[a.id] = a; });

  const animalesForm = animals.filter((a) => a.estado === "activo" && (a.especie || "bovino") === formEspecie);
  const lotesForm = lotes.filter((l) => !l.especie || l.especie === formEspecie || l.especie === "mixto");
  const tiposForm = PROCEDIMIENTOS_POR_ESPECIE[formEspecie] || [];

  const today = new Date().toISOString().split("T")[0];
  const upcoming = procedimientos.filter((p) => p.proxima_fecha && p.proxima_fecha >= today);

  const filtered = useMemo(() => procedimientos.filter((p) => {
    const especie = p.especie || animalMap[p.animal_id]?.especie || "bovino";
    if (filterEspecie !== "all" && especie !== filterEspecie) return false;
    if (filterTipo !== "all" && p.tipo !== filterTipo) return false;
    if (filterFinca !== "all" && p.finca_id !== filterFinca) return false;
    if (filterLote !== "all" && p.lote_id !== filterLote) return false;
    if (filterResponsable && !(p.responsable || "").toLowerCase().includes(filterResponsable.toLowerCase())) return false;
    if (fechaDesde && p.fecha < fechaDesde) return false;
    if (fechaHasta && p.fecha > fechaHasta) return false;
    return true;
  }), [procedimientos, filterEspecie, filterTipo, filterFinca, filterLote, filterResponsable, fechaDesde, fechaHasta, animalMap]);

  const tiposFiltro = filterEspecie !== "all" ? PROCEDIMIENTOS_POR_ESPECIE[filterEspecie] || [] : Object.keys(TIPO_PROCEDIMIENTO);

  return (
    <div>
      <PageHeader title="Procedimientos / Manejos" subtitle={`${filtered.length} registros`}>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" /> Nuevo</Button>
      </PageHeader>

      {/* Filtro especie */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all", label: "Todas las especies" },
          { key: "bovino", label: "🐄 Bovinos" },
          { key: "ovino", label: "🐑 Ovinos" },
          { key: "equino", label: "🐴 Equinos" },
        ].map((e) => (
          <button key={e.key} onClick={() => setFilterEspecie(e.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{e.label}</button>
        ))}
      </div>

      {/* Próximos procedimientos */}
      {upcoming.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Próximas revisiones</h3>
          {upcoming.slice(0, 3).map((p) => (
            <Card key={p.id} className="p-3 border-l-4 border-l-amber-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{TIPO_PROCEDIMIENTO[p.tipo] || p.tipo}{p.detalle ? ` - ${p.detalle}` : ""}</p>
                  <p className="text-xs text-muted-foreground">Revisión: {format(new Date(p.proxima_fecha), "dd MMM yyyy", { locale: es })}</p>
                </div>
                <StatusBadge status="pendiente" label="Pendiente" color="yellow" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filtros avanzados */}
      <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2 mb-3"><Filter className="w-4 h-4" /> Filtros</Button>
      {showFilters && (
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Tipo de procedimiento</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {tiposFiltro.map((t) => <SelectItem key={t} value={t}>{TIPO_PROCEDIMIENTO[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Finca</Label>
              <Select value={filterFinca} onValueChange={setFilterFinca}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Lote / Potrero</Label>
              <Select value={filterLote} onValueChange={setFilterLote}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {lotes.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Responsable</Label>
              <Input value={filterResponsable} onChange={(e) => setFilterResponsable(e.target.value)} placeholder="Nombre" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
          </div>
        </Card>
      )}

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={ClipboardList} title="Sin procedimientos" description="Registra topizados, herrajes, castraciones, tatuajes y más" actionLabel="Nuevo" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const animal = animalMap[p.animal_id];
            const especie = p.especie || animal?.especie || "bovino";
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{TIPO_PROCEDIMIENTO[p.tipo] || p.tipo}</p>
                        {p.detalle && <span className="text-sm text-muted-foreground">({p.detalle})</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${ESPECIE_COLORS[especie] || "bg-gray-100 text-gray-600"}`}>
                          {ESPECIE_LABELS[especie] || especie}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.fecha ? format(new Date(p.fecha), "dd MMM yyyy", { locale: es }) : ""}
                        {p.tipo_registro === "individual" && animal ? ` • #${animal.numero}` : ""}
                        {p.tipo_registro === "lote" && p.numero_animales ? ` • ${p.numero_animales} animales` : ""}
                        {p.responsable ? ` • ${p.responsable}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.costo > 0 && <p className="font-bold">{formatCurrency(p.costo)}</p>}
                    <DeleteConfirmButton entityName="Procedimiento" recordId={p.id} recordLabel="este procedimiento" queryKeysToInvalidate={["procedimientos"]} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open && isNew) navigate("/procedimientos"); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Nuevo Procedimiento / Manejo</DialogTitle></DialogHeader>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Especie</Label>
            <div className="flex gap-2 mb-2">
              {[
                { key: "bovino", label: "🐄 Bovino" },
                { key: "ovino", label: "🐑 Ovino" },
                { key: "equino", label: "🐴 Equino" },
              ].map((e) => (
                <button key={e.key} type="button" onClick={() => setFormEspecie(e.key)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    formEspecie === e.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
                  }`}>{e.label}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <Button size="sm" variant={tipoRegistro === "individual" ? "default" : "outline"} onClick={() => setTipoRegistro("individual")}>Individual</Button>
            <Button size="sm" variant={tipoRegistro === "lote" ? "default" : "outline"} onClick={() => setTipoRegistro("lote")}>Por lote</Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Fecha *</Label>
              <Input name="fecha" type="date" defaultValue={today} required />
            </div>
            <div>
              <Label>Tipo de procedimiento *</Label>
              <Select name="tipo" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {tiposForm.map((t) => <SelectItem key={t} value={t}>{TIPO_PROCEDIMIENTO[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {tipoRegistro === "individual" ? (
              <div>
                <Label>Animal * <span className="text-xs text-amber-600">({animalesForm.length} {ESPECIE_LABELS[formEspecie]})</span></Label>
                <Select name="animal_id" defaultValue={preAnimal || ""} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {animalesForm.map((a) => (
                      <SelectItem key={a.id} value={a.id}>#{a.numero} {a.nombre ? `(${a.nombre})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label>Finca</Label>
                  <Select name="finca_id">
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lote / Potrero</Label>
                  <Select name="lote_id">
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {lotesForm.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>N° de animales</Label>
                  <Input name="numero_animales" type="number" />
                </div>
              </>
            )}

            <div>
              <Label>Detalle (n° hierro, microchip, etc.)</Label>
              <Input name="detalle" placeholder="Ej: Hierro RJ-01" />
            </div>
            <div>
              <Label>Costo</Label>
              <Input name="costo" type="number" placeholder="0" />
            </div>
            <div>
              <Label>Responsable</Label>
              <Input name="responsable" />
            </div>
            <div>
              <Label>Próxima revisión</Label>
              <Input name="proxima_fecha" type="date" />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea name="observaciones" />
            </div>
            <Button type="submit" className="w-full h-12" disabled={createMutation.isPending}>
              Guardar Procedimiento
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}