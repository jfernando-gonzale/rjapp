import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Truck, TestTube, AlertTriangle, Edit, MapPin, Package } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";
import { useToast } from "@/components/ui/use-toast";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const RAZAS = { criollo: "Criollo", appaloosa: "Appaloosa", cuarto_de_milla: "Cuarto de Milla", pinto_americano: "Pinto Americano", pura_sangre_espanol: "Pura Sangre Español", pura_sangre_lusitano: "Pura Sangre Lusitano", otra: "Otra" };
const ESTADO_COLORS = { activo: "bg-green-100 text-green-800", inactivo: "bg-gray-100 text-gray-600", retirado: "bg-orange-100 text-orange-800", vendido: "bg-blue-100 text-blue-800", muerto: "bg-red-100 text-red-800" };
const ESTADO_LABELS = { activo: "Activo", inactivo: "Inactivo", retirado: "Retirado", vendido: "Vendido", muerto: "Muerto" };
const NOVEDAD_LABELS = { repeticion: "Repetición", no_quedo_prenada: "No quedó preñada", problema_transporte: "Problema de transporte", dosis_mal_estado: "Dosis en mal estado", retraso_entrega: "Retraso en entrega", otra: "Otra" };
const CALIDAD_COLORS = { excelente: "text-green-600", buena: "text-blue-600", regular: "text-amber-600", mala: "text-red-600" };
const SERVICIO_LABELS = { inseminacion_artificial: "IA", monta_natural: "Monta natural", transferencia_embriones: "TE" };
const DESPACHO_ESTADO_COLORS = { programado: "bg-amber-100 text-amber-800", enviado: "bg-blue-100 text-blue-800", entregado: "bg-green-100 text-green-800", cancelado: "bg-gray-100 text-gray-600", con_novedad: "bg-red-100 text-red-800" };

const fmt = (d) => { try { return format(new Date(d), "dd MMM yyyy", { locale: es }); } catch { return d || "—"; } };

export default function ReproductorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [colectaOpen, setColectaOpen] = useState(false);
  const [servicioOpen, setServicioOpen] = useState(false);
  const [inconformidadOpen, setInconformidadOpen] = useState(false);
  const [despachoOpen, setDespachoOpen] = useState(false);

  const [colectaForm, setColectaForm] = useState({ fecha: new Date().toISOString().split("T")[0], numero_dosis: "", calidad: "buena", responsable: "", volumen: "", concentracion: "", motilidad: "", observaciones: "" });
  const [servicioForm, setServicioForm] = useState({ fecha: new Date().toISOString().split("T")[0], tipo_servicio: "inseminacion_artificial", resultado: "pendiente", responsable: "", observaciones: "" });
  const [inconformidadForm, setInconformidadForm] = useState({ fecha_reporte: new Date().toISOString().split("T")[0], tipo_novedad: "repeticion", descripcion: "", accion_tomada: "seguimiento", estado: "abierta", observaciones: "" });
  const [despachoForm, setDespachoForm] = useState({ fecha_despacho: new Date().toISOString().split("T")[0], cliente_id: "", ciudad_destino: "", departamento_destino: "", numero_dosis: "", valor_cobrado: "", transportadora: "", numero_guia: "", fecha_estimada_llegada: "", estado: "programado", observaciones: "" });

  const { data: rep } = useQuery({ queryKey: ["reproductor", id], queryFn: () => base44.entities.Reproductor.get(id) });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: () => base44.entities.Cliente.list() });
  const { data: yeguas = [] } = useQuery({ queryKey: ["yeguas"], queryFn: () => base44.entities.Yegua.list() });
  const { data: colectas = [] } = useQuery({ queryKey: ["colectas"], queryFn: () => base44.entities.Colecta.list(), select: d => d.filter(c => c.reproductor_id === id).sort((a,b) => b.fecha?.localeCompare(a.fecha)) });
  const { data: despachos = [] } = useQuery({ queryKey: ["despachos"], queryFn: () => base44.entities.Despacho.list(), select: d => d.filter(x => x.reproductor_id === id).sort((a,b) => b.fecha_despacho?.localeCompare(a.fecha_despacho)) });
  const { data: servicios = [] } = useQuery({ queryKey: ["servicios_internos"], queryFn: () => base44.entities.ServicioInterno.list(), select: d => d.filter(s => s.reproductor_id === id).sort((a,b) => b.fecha?.localeCompare(a.fecha)) });
  const { data: inconformidades = [] } = useQuery({ queryKey: ["inconformidades"], queryFn: () => base44.entities.Inconformidad.list(), select: d => d.filter(i => i.reproductor_id === id).sort((a,b) => b.fecha_reporte?.localeCompare(a.fecha_reporte)) });

  const saveColecta = useMutation({ mutationFn: (d) => base44.entities.Colecta.create({ ...d, reproductor_id: id, numero_dosis: Number(d.numero_dosis) || 0 }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["colectas"] }); setColectaOpen(false); toast({ title: "Colecta registrada" }); } });
  const saveServicio = useMutation({ mutationFn: (d) => base44.entities.ServicioInterno.create({ ...d, reproductor_id: id }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["servicios_internos"] }); setServicioOpen(false); toast({ title: "Servicio registrado" }); } });
  const saveInconformidad = useMutation({ mutationFn: (d) => base44.entities.Inconformidad.create({ ...d, reproductor_id: id }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["inconformidades"] }); setInconformidadOpen(false); toast({ title: "Inconformidad registrada" }); } });
  const saveDespacho = useMutation({ mutationFn: (d) => base44.entities.Despacho.create({ ...d, reproductor_id: id, reproductor: rep?.nombre, numero_dosis: Number(d.numero_dosis) || 0, valor_cobrado: Number(d.valor_cobrado) || 0 }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["despachos"] }); setDespachoOpen(false); toast({ title: "Despacho registrado" }); } });

  if (!rep) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  const totalDosis = colectas.reduce((s, c) => s + (c.numero_dosis || 0), 0);
  const totalVentas = despachos.reduce((s, d) => s + (d.valor_cobrado || 0), 0);
  const dosisDespachadas = despachos.reduce((s, d) => s + (d.numero_dosis || 0), 0);
  const clientesAtendidos = [...new Set(despachos.map(d => d.cliente_id).filter(Boolean))].length;
  const ciudades = [...new Set(despachos.map(d => d.ciudad_destino).filter(Boolean))];
  const inconformidadesAbiertas = inconformidades.filter(i => i.estado === "abierta").length;
  const ultimaColecta = colectas[0]?.fecha;
  const ultimoDespacho = despachos[0]?.fecha_despacho;
  const getFinca = (fId) => fincas.find(f => f.id === fId)?.nombre || "—";
  const getCliente = (cId) => clientes.find(c => c.id === cId)?.nombre || "—";
  const getYegua = (yId) => yeguas.find(y => y.id === yId)?.nombre || "—";

  return (
    <div className="space-y-4">
      <Button variant="ghost" className="gap-2" onClick={() => navigate("/reproductores")}>
        <ArrowLeft className="w-4 h-4" /> Reproductores
      </Button>

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-heading font-bold">{rep.nombre}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADO_COLORS[rep.estado] || "bg-gray-100"}`}>{ESTADO_LABELS[rep.estado]}</span>
              {rep.tipo === "externo" && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Externo</span>}
            </div>
            <p className="text-muted-foreground">{RAZAS[rep.raza] || rep.raza} {rep.color ? `· ${rep.color}` : ""} {rep.registro ? `· Reg: ${rep.registro}` : ""}</p>
            <p className="text-sm text-muted-foreground mt-1">{getFinca(rep.finca_id)} {rep.ubicacion ? `· ${rep.ubicacion}` : ""} {rep.edad_aproximada ? `· ${rep.edad_aproximada}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/reproductores/${id}/editar`}>
              <Button variant="outline" className="gap-2"><Edit className="w-4 h-4" /> Editar</Button>
            </Link>
            <DeleteConfirmButton
              entityName="Reproductor"
              recordId={id}
              recordLabel={`el reproductor "${rep.nombre}"`}
              queryKeysToInvalidate={["reproductores"]}
              iconOnly={false}
              onDeleted={() => navigate("/reproductores")}
            />
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Colectas", value: colectas.length },
          { label: "Dosis obtenidas", value: totalDosis },
          { label: "Dosis despachadas", value: dosisDespachadas },
          { label: "Total vendido", value: formatCurrency(totalVentas), large: true },
          { label: "Despachos", value: despachos.length },
          { label: "Clientes", value: clientesAtendidos },
          { label: "Ciudades", value: ciudades.length },
          { label: "Inconformidades abiertas", value: inconformidadesAbiertas, danger: inconformidadesAbiertas > 0 },
        ].map((s, i) => (
          <Card key={i} className={`p-3 ${s.danger ? "border-red-200" : ""}`}>
            <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
            <p className={`font-heading font-bold ${s.large ? "text-lg" : "text-xl"} ${s.danger ? "text-red-600" : ""}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {ultimaColecta && <p className="text-xs text-muted-foreground">Última colecta: {fmt(ultimaColecta)} · Último despacho: {ultimoDespacho ? fmt(ultimoDespacho) : "—"}</p>}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setColectaOpen(true)} className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
          <TestTube className="w-4 h-4" /> Nueva colecta
        </Button>
        <Button onClick={() => setDespachoOpen(true)} variant="outline" className="gap-2">
          <Truck className="w-4 h-4" /> Nuevo despacho
        </Button>
        <Button onClick={() => setServicioOpen(true)} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Servicio interno
        </Button>
        <Button onClick={() => setInconformidadOpen(true)} variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
          <AlertTriangle className="w-4 h-4" /> Inconformidad
        </Button>
      </div>

      {/* Historial tabs */}
      <Tabs defaultValue="colectas">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="colectas">Colectas ({colectas.length})</TabsTrigger>
          <TabsTrigger value="despachos">Despachos ({despachos.length})</TabsTrigger>
          <TabsTrigger value="servicios">Servicios ({servicios.length})</TabsTrigger>
          <TabsTrigger value="inconformidades">Inconformidades ({inconformidades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="colectas" className="space-y-2 mt-3">
          {colectas.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sin colectas registradas</p> : colectas.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{fmt(c.fecha)}</span>{c.calidad && <span className={`text-sm font-medium capitalize ${CALIDAD_COLORS[c.calidad] || ""}`}>{c.calidad}</span>}</div>
                  <p className="text-sm text-muted-foreground">{c.numero_dosis || 0} dosis {c.responsable ? `· ${c.responsable}` : ""} {c.motilidad ? `· Motilidad: ${c.motilidad}` : ""}</p>
                  {c.observaciones && <p className="text-xs text-muted-foreground mt-0.5">{c.observaciones}</p>}
                </div>
                <span className="text-2xl font-heading font-bold text-amber-600">{c.numero_dosis || 0}</span>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="despachos" className="space-y-2 mt-3">
          {despachos.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sin despachos</p> : despachos.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{getCliente(d.cliente_id)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DESPACHO_ESTADO_COLORS[d.estado] || "bg-gray-100"}`}>{d.estado}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{fmt(d.fecha_despacho)} {d.ciudad_destino ? `· ${d.ciudad_destino}` : ""} {d.numero_dosis ? `· ${d.numero_dosis} dosis` : ""}</p>
                </div>
                {d.valor_cobrado > 0 && <span className="font-bold">{formatCurrency(d.valor_cobrado)}</span>}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="servicios" className="space-y-2 mt-3">
          {servicios.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sin servicios internos</p> : servicios.map(s => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{SERVICIO_LABELS[s.tipo_servicio] || s.tipo_servicio}</span><span className="text-sm text-muted-foreground">{fmt(s.fecha)}</span></div>
                  {s.yegua_id && <p className="text-sm text-muted-foreground">Yegua: {getYegua(s.yegua_id)}</p>}
                  <p className="text-sm text-muted-foreground capitalize">Resultado: {s.resultado}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="inconformidades" className="space-y-2 mt-3">
          {inconformidades.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Sin inconformidades</p> : inconformidades.map(i => (
            <Card key={i.id} className={`p-4 ${i.estado === "abierta" ? "border-l-4 border-l-red-400" : ""}`}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{NOVEDAD_LABELS[i.tipo_novedad] || i.tipo_novedad}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i.estado === "abierta" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{i.estado}</span></div>
                  <p className="text-sm text-muted-foreground">{getCliente(i.cliente_id)} · {fmt(i.fecha_reporte)}</p>
                  {i.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{i.descripcion}</p>}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modal colecta */}
      <Dialog open={colectaOpen} onOpenChange={setColectaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva Colecta — {rep.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Fecha *</Label><Input type="date" value={colectaForm.fecha} onChange={e => setColectaForm(p => ({ ...p, fecha: e.target.value }))} /></div>
              <div><Label>N° dosis obtenidas</Label><Input type="number" value={colectaForm.numero_dosis} onChange={e => setColectaForm(p => ({ ...p, numero_dosis: e.target.value }))} placeholder="0" /></div>
              <div><Label>Calidad</Label>
                <Select value={colectaForm.calidad} onValueChange={v => setColectaForm(p => ({ ...p, calidad: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="buena">Buena</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="mala">Mala</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Hora</Label><Input value={colectaForm.hora} onChange={e => setColectaForm(p => ({ ...p, hora: e.target.value }))} placeholder="HH:MM" /></div>
              <div><Label>Responsable</Label><Input value={colectaForm.responsable} onChange={e => setColectaForm(p => ({ ...p, responsable: e.target.value }))} /></div>
              <div><Label>Volumen</Label><Input value={colectaForm.volumen} onChange={e => setColectaForm(p => ({ ...p, volumen: e.target.value }))} placeholder="ml" /></div>
              <div><Label>Motilidad %</Label><Input value={colectaForm.motilidad} onChange={e => setColectaForm(p => ({ ...p, motilidad: e.target.value }))} placeholder="%" /></div>
              <div className="col-span-2"><Label>Observaciones</Label><Textarea value={colectaForm.observaciones} onChange={e => setColectaForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} /></div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setColectaOpen(false)}>Cancelar</Button><Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={() => saveColecta.mutate(colectaForm)} disabled={saveColecta.isPending}>Guardar colecta</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal servicio interno */}
      <Dialog open={servicioOpen} onOpenChange={setServicioOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Servicio Interno — {rep.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Fecha *</Label><Input type="date" value={servicioForm.fecha} onChange={e => setServicioForm(p => ({ ...p, fecha: e.target.value }))} /></div>
            <div><Label>Tipo de servicio *</Label>
              <Select value={servicioForm.tipo_servicio} onValueChange={v => setServicioForm(p => ({ ...p, tipo_servicio: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inseminacion_artificial">Inseminación artificial</SelectItem>
                  <SelectItem value="monta_natural">Monta natural</SelectItem>
                  <SelectItem value="transferencia_embriones">Semen para TE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Yegua relacionada (opcional)</Label>
              <Select value={servicioForm.yegua_id || ""} onValueChange={v => setServicioForm(p => ({ ...p, yegua_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar yegua" /></SelectTrigger>
                <SelectContent>
                  {yeguas.map(y => <SelectItem key={y.id} value={y.id}>{y.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Resultado</Label>
              <Select value={servicioForm.resultado} onValueChange={v => setServicioForm(p => ({ ...p, resultado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="prenada">Preñada</SelectItem>
                  <SelectItem value="repitio">Repitió</SelectItem>
                  <SelectItem value="fallida">Fallida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Responsable</Label><Input value={servicioForm.responsable} onChange={e => setServicioForm(p => ({ ...p, responsable: e.target.value }))} /></div>
            <div><Label>Observaciones</Label><Textarea value={servicioForm.observaciones} onChange={e => setServicioForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setServicioOpen(false)}>Cancelar</Button><Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={() => saveServicio.mutate(servicioForm)} disabled={saveServicio.isPending}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal inconformidad */}
      <Dialog open={inconformidadOpen} onOpenChange={setInconformidadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva Inconformidad — {rep.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div><Label>Fecha del reporte *</Label><Input type="date" value={inconformidadForm.fecha_reporte} onChange={e => setInconformidadForm(p => ({ ...p, fecha_reporte: e.target.value }))} /></div>
            <div><Label>Cliente</Label>
              <Select value={inconformidadForm.cliente_id || ""} onValueChange={v => setInconformidadForm(p => ({ ...p, cliente_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo de novedad *</Label>
              <Select value={inconformidadForm.tipo_novedad} onValueChange={v => setInconformidadForm(p => ({ ...p, tipo_novedad: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="repeticion">Repetición</SelectItem>
                  <SelectItem value="no_quedo_prenada">No quedó preñada</SelectItem>
                  <SelectItem value="problema_transporte">Problema de transporte</SelectItem>
                  <SelectItem value="dosis_mal_estado">Dosis en mal estado</SelectItem>
                  <SelectItem value="retraso_entrega">Retraso en entrega</SelectItem>
                  <SelectItem value="otra">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descripción</Label><Textarea value={inconformidadForm.descripcion} onChange={e => setInconformidadForm(p => ({ ...p, descripcion: e.target.value }))} rows={2} /></div>
            <div><Label>Acción tomada</Label>
              <Select value={inconformidadForm.accion_tomada} onValueChange={v => setInconformidadForm(p => ({ ...p, accion_tomada: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="reenvio">Reenvío</SelectItem>
                  <SelectItem value="descuento">Descuento</SelectItem>
                  <SelectItem value="sin_accion">Sin acción</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Estado</Label>
              <Select value={inconformidadForm.estado} onValueChange={v => setInconformidadForm(p => ({ ...p, estado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="abierta">Abierta</SelectItem><SelectItem value="cerrada">Cerrada</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Observaciones</Label><Textarea value={inconformidadForm.observaciones} onChange={e => setInconformidadForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} /></div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setInconformidadOpen(false)}>Cancelar</Button><Button className="bg-red-500 hover:bg-red-600 text-white font-semibold" onClick={() => saveInconformidad.mutate(inconformidadForm)} disabled={saveInconformidad.isPending}>Guardar</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal despacho */}
      <Dialog open={despachoOpen} onOpenChange={setDespachoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Despacho — {rep.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Fecha despacho *</Label><Input type="date" value={despachoForm.fecha_despacho} onChange={e => setDespachoForm(p => ({ ...p, fecha_despacho: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Cliente</Label>
                <Select value={despachoForm.cliente_id} onValueChange={v => setDespachoForm(p => ({ ...p, cliente_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ciudad destino</Label><Input value={despachoForm.ciudad_destino} onChange={e => setDespachoForm(p => ({ ...p, ciudad_destino: e.target.value }))} placeholder="Ciudad" /></div>
              <div><Label>Departamento</Label><Input value={despachoForm.departamento_destino} onChange={e => setDespachoForm(p => ({ ...p, departamento_destino: e.target.value }))} placeholder="Departamento" /></div>
              <div><Label>N° dosis</Label><Input type="number" value={despachoForm.numero_dosis} onChange={e => setDespachoForm(p => ({ ...p, numero_dosis: e.target.value }))} placeholder="0" /></div>
              <div><Label>Valor cobrado ($)</Label><Input type="number" value={despachoForm.valor_cobrado} onChange={e => setDespachoForm(p => ({ ...p, valor_cobrado: e.target.value }))} placeholder="0" /></div>
              <div><Label>Transportadora</Label><Input value={despachoForm.transportadora} onChange={e => setDespachoForm(p => ({ ...p, transportadora: e.target.value }))} placeholder="Ej: Servientrega" /></div>
              <div><Label>Número de guía</Label><Input value={despachoForm.numero_guia} onChange={e => setDespachoForm(p => ({ ...p, numero_guia: e.target.value }))} /></div>
              <div><Label>Fecha est. llegada</Label><Input type="date" value={despachoForm.fecha_estimada_llegada} onChange={e => setDespachoForm(p => ({ ...p, fecha_estimada_llegada: e.target.value }))} /></div>
              <div><Label>Estado</Label>
                <Select value={despachoForm.estado} onValueChange={v => setDespachoForm(p => ({ ...p, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="con_novedad">Con novedad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Observaciones</Label><Textarea value={despachoForm.observaciones} onChange={e => setDespachoForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} /></div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setDespachoOpen(false)}>Cancelar</Button><Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={() => saveDespacho.mutate(despachoForm)} disabled={saveDespacho.isPending}>Guardar despacho</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}