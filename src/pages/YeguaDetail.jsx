import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Bug as Horse, Heart, Baby, GitBranch, Calendar,
  Eye, AlertTriangle, RotateCcw, Edit, Pencil
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import PageHeader from "@/components/shared/PageHeader";
import EstadoReproductivoBadge from "@/components/caballos/EstadoReproductivoBadge";
import EstadoCriaBadge from "@/components/caballos/EstadoCriaBadge";
import {
  ESTADO_REPRODUCTIVO, RESULTADO_INSEMINACION, RESULTADO_INSEMINACION_COLORS,
  METODO_CONFIRMACION, RESULTADO_PARTO, RESULTADO_PARTO_COLORS,
  SEXO_CRIA, TIPO_INSEMINACION, NUEVA_ACCION_CELO,
  calcDiasGestacion, calcDiasFaltantesParto, calcFechaDesteteSugerida
} from "@/lib/caballos";
import { toast } from "sonner";

export default function YeguaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: yeguas = [] } = useQuery({
    queryKey: ["yeguas"],
    queryFn: () => base44.entities.Yegua.list(),
  });
  const yegua = yeguas.find(y => y.id === id);

  const { data: fincas = [] } = useQuery({
    queryKey: ["fincas"],
    queryFn: () => base44.entities.Finca.list(),
  });

  const { data: inseminaciones = [] } = useQuery({
    queryKey: ["inseminaciones"],
    queryFn: () => base44.entities.Inseminacion.list(),
  });

  const { data: confirmaciones = [] } = useQuery({
    queryKey: ["confirmaciones"],
    queryFn: () => base44.entities.ConfirmacionPreñez.list(),
  });

  const { data: partos = [] } = useQuery({
    queryKey: ["partos"],
    queryFn: () => base44.entities.Parto.list(),
  });

  const { data: repeticiones = [] } = useQuery({
    queryKey: ["repeticiones"],
    queryFn: () => base44.entities.RepeticionCelo.list(),
  });

  const { data: crias = [] } = useQuery({
    queryKey: ["crias"],
    queryFn: () => base44.entities.Cria.list(),
  });

  if (!yegua) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/caballos/yeguas")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No se encontró la yegua</p>
        </Card>
      </div>
    );
  }

  const finca = fincas.find(f => f.id === yegua.finca_id);
  const inseminacionesYegua = inseminaciones
    .filter(i => i.yegua_id === id)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const confirmacionesYegua = confirmaciones
    .filter(c => c.yegua_id === id)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const partosYegua = partos
    .filter(p => p.yegua_id === id)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const repeticionesYegua = repeticiones
    .filter(r => r.yegua_id === id)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  const criasYegua = crias.filter(c => c.madre_id === id);
  const criaActual = crias.find(c => c.id === yegua.cria_actual_id);

  const diasGestacion = yegua.fecha_ultima_inseminacion ? calcDiasGestacion(yegua.fecha_ultima_inseminacion) : null;
  const diasParto = yegua.fecha_probable_parto ? calcDiasFaltantesParto(yegua.fecha_probable_parto) : null;
  const fechaDesteteCria = criaActual?.fecha_nacimiento ? calcFechaDesteteSugerida(criaActual.fecha_nacimiento) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/caballos/yeguas")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Horse className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">{yegua.nombre}</h1>
              {yegua.numero && <p className="text-sm text-muted-foreground">#{yegua.numero}</p>}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/caballos/yeguas/${id}/editar`)} className="gap-2">
          <Pencil className="w-4 h-4" /> Editar
        </Button>
      </div>

      {/* Estado y info básica */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <EstadoReproductivoBadge estado={yegua.estado_reproductivo} className="text-sm px-3 py-1" />
          {yegua.raza && <Badge variant="outline">{yegua.raza}</Badge>}
          {yegua.color && <Badge variant="outline">{yegua.color}</Badge>}
          {finca && <Badge variant="outline">{finca.nombre}</Badge>}
        </div>

        {yegua.observaciones && (
          <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-lg">"{yegua.observaciones}"</p>
        )}
      </Card>

      {/* Botones de acción rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Button
          onClick={() => navigate(`/caballos/inseminacion/nueva?yegua_id=${id}`)}
          className="gap-2"
          size="sm"
        >
          <Heart className="w-4 h-4" /> Inseminar
        </Button>
        <Button
          onClick={() => navigate(`/caballos/preñez/nueva?yegua_id=${id}`)}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Eye className="w-4 h-4" /> Confirmar preñez
        </Button>
        <Button
          onClick={() => navigate(`/caballos/celo/nueva?yegua_id=${id}`)}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <RotateCcw className="w-4 h-4" /> Repitió celo
        </Button>
        <Button
          onClick={() => navigate(`/caballos/parto/nuevo?yegua_id=${id}`)}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Baby className="w-4 h-4" /> Registrar parto
        </Button>
        <Button
          onClick={() => navigate(`/caballos/destete/nuevo?madre_id=${id}`)}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <GitBranch className="w-4 h-4" /> Destetar cría
        </Button>
        <Button
          onClick={() => navigate(`/caballos/yeguas/${id}/editar`)}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Edit className="w-4 h-4" /> Editar
        </Button>
      </div>

      {/* Resumen reproductivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Última inseminación</p>
          <p className="font-semibold">{yegua.fecha_ultima_inseminacion || "Sin registro"}</p>
          {inseminacionesYegua[0] && (
            <p className="text-xs text-muted-foreground mt-1">
              {TIPO_INSEMINACION[inseminacionesYegua[0].tipo]} · {RESULTADO_INSEMINACION[inseminacionesYegua[0].resultado]}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Fecha probable de parto</p>
          <p className={`font-semibold ${diasParto !== null && diasParto < 7 ? 'text-red-600' : diasParto !== null && diasParto < 30 ? 'text-amber-600' : ''}`}>
            {yegua.fecha_probable_parto || "Sin calcular"}
          </p>
          {diasParto !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              {diasParto >= 0 ? `Faltan ${diasParto} días` : `Vencido hace ${Math.abs(diasParto)} días`}
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Días de gestación</p>
          <p className="font-semibold">{diasGestacion !== null ? `${diasGestacion} días` : "N/A"}</p>
          {yegua.fecha_confirmacion_preñez && (
            <p className="text-xs text-muted-foreground mt-1">Confirmada: {yegua.fecha_confirmacion_preñez}</p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Último parto</p>
          <p className="font-semibold">{yegua.fecha_ultimo_parto || "Sin registro"}</p>
          {partosYegua[0] && (
            <p className="text-xs text-muted-foreground mt-1">{RESULTADO_PARTO[partosYegua[0].resultado]}</p>
          )}
        </Card>
      </div>

      {/* Alertas */}
      {(diasParto !== null && diasParto < 0) || repeticionesYegua.length >= 2 ? (
        <div className="space-y-2">
          {diasParto !== null && diasParto < 0 && (
            <Card className="p-4 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-sm font-semibold">Fecha probable de parto vencida hace {Math.abs(diasParto)} días</p>
              </div>
            </Card>
          )}
          {repeticionesYegua.length >= 2 && (
            <Card className="p-4 border-l-4 border-l-orange-400">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                <p className="text-sm font-semibold">Ha repetido celo {repeticionesYegua.length} veces. Considera revisar con veterinario.</p>
              </div>
            </Card>
          )}
        </div>
      ) : null}

      {/* Cría actual */}
      {criaActual && (
        <Card className="p-5">
          <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
            <Baby className="w-5 h-5 text-amber-500" /> Cría actual
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Nombre:</span>
              <span className="font-medium ml-2">{criaActual.nombre || "Sin nombre"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nacimiento:</span>
              <span className="font-medium ml-2">{criaActual.fecha_nacimiento}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sexo:</span>
              <span className="font-medium ml-2">{SEXO_CRIA[criaActual.sexo]}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <span className="ml-2"><EstadoCriaBadge estado={criaActual.estado} /></span>
            </div>
            {fechaDesteteCria && (
              <div>
                <span className="text-muted-foreground">Destete sugerido:</span>
                <span className="font-medium ml-2">{fechaDesteteCria}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Historial */}
      <Tabs defaultValue="inseminaciones">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="inseminaciones">Inseminaciones ({inseminacionesYegua.length})</TabsTrigger>
          <TabsTrigger value="confirmaciones">Preñeces ({confirmacionesYegua.length})</TabsTrigger>
          <TabsTrigger value="celos">Celos ({repeticionesYegua.length})</TabsTrigger>
          <TabsTrigger value="partos">Partos ({partosYegua.length})</TabsTrigger>
          <TabsTrigger value="crias">Crías ({criasYegua.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inseminaciones">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Reproductor</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inseminacionesYegua.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin registros</TableCell></TableRow>
                ) : inseminacionesYegua.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.fecha}</TableCell>
                    <TableCell className="text-sm">{TIPO_INSEMINACION[i.tipo]}</TableCell>
                    <TableCell className="text-sm">{i.reproductor || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${RESULTADO_INSEMINACION_COLORS[i.resultado]}`}>
                        {RESULTADO_INSEMINACION[i.resultado]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="confirmaciones">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Inseminación</TableHead>
                  <TableHead>Parto probable</TableHead>
                  <TableHead>Veterinario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmacionesYegua.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin registros</TableCell></TableRow>
                ) : confirmacionesYegua.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.fecha}</TableCell>
                    <TableCell className="text-sm">{METODO_CONFIRMACION[c.metodo]}</TableCell>
                    <TableCell className="text-sm">{c.fecha_inseminacion}</TableCell>
                    <TableCell className="text-sm font-medium">{c.fecha_probable_parto}</TableCell>
                    <TableCell className="text-sm">{c.veterinario || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="celos">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Insem. anterior</TableHead>
                  <TableHead>Acción tomada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeticionesYegua.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin registros</TableCell></TableRow>
                ) : repeticionesYegua.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.fecha}</TableCell>
                    <TableCell className="text-sm">{r.fecha_inseminacion_anterior || "-"}</TableCell>
                    <TableCell className="text-sm">{NUEVA_ACCION_CELO[r.nueva_accion]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="partos">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Sexo cría</TableHead>
                  <TableHead>Nombre cría</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partosYegua.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin registros</TableCell></TableRow>
                ) : partosYegua.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fecha}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${RESULTADO_PARTO_COLORS[p.resultado]}`}>
                        {RESULTADO_PARTO[p.resultado]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{SEXO_CRIA[p.sexo_cria]}</TableCell>
                    <TableCell className="text-sm">{p.nombre_cria || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="crias">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {criasYegua.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground col-span-full">Sin crías registradas</Card>
            ) : criasYegua.map(c => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-amber-500" />
                    <h3 className="font-medium">{c.nombre || "Sin nombre"}</h3>
                  </div>
                  <EstadoCriaBadge estado={c.estado} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Nacimiento:</span><span>{c.fecha_nacimiento}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sexo:</span><span>{SEXO_CRIA[c.sexo]}</span></div>
                  {c.fecha_destete && <div className="flex justify-between"><span className="text-muted-foreground">Destete:</span><span>{c.fecha_destete}</span></div>}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}