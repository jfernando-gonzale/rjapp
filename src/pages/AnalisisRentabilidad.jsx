import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import CostosProduccion from "@/components/reportes/CostosProduccion";
import SemaforoRentabilidad from "@/components/shared/SemaforoRentabilidad";
import { formatCurrency } from "@/lib/helpers";
import { calcRentabilidadCeba, semaforoRentabilidad, getMargenesMinimos } from "@/lib/costosProduccion";
import { TrendingUp, Scale, Target, PiggyBank, ArrowLeft } from "lucide-react";

function IndicadorCard({ titulo, valor, subtitulo, icon: Icon, color = "primary" }) {
  const colors = {
    primary: "text-amber-600", blue: "text-blue-600", green: "text-emerald-600",
    red: "text-red-600", gray: "text-gray-500",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{titulo}</p>
        {Icon ? <Icon className={`w-4 h-4 ${colors[color]}`} /> : null}
      </div>
      <p className={`text-lg font-heading font-bold ${colors[color]}`}>{valor}</p>
      {subtitulo && <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>}
    </Card>
  );
}

export default function AnalisisRentabilidad() {
  const [fEspecie, setFEspecie] = useState("all");
  const [fFinca, setFFinca] = useState("all");
  const [fLote, setFLote] = useState("all");
  const [fLinea, setFLinea] = useState("todos");
  const [fEstado, setFEstado] = useState("activo");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");
  const [fPropietario, setFPropietario] = useState("all");

  const { data: animals = [] } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: lotes = [] } = useQuery({ queryKey: ["lotes"], queryFn: () => base44.entities.Lote.list() });
  const { data: gastos = [] } = useQuery({ queryKey: ["gastos"], queryFn: () => base44.entities.Gasto.list() });
  const { data: ventas = [] } = useQuery({ queryKey: ["ventas"], queryFn: () => base44.entities.Venta.list() });
  const { data: tratamientos = [] } = useQuery({ queryKey: ["tratamientos"], queryFn: () => base44.entities.Tratamiento.list() });
  const { data: procedimientos = [] } = useQuery({ queryKey: ["procedimientos"], queryFn: () => base44.entities.Procedimiento.list() });
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: yeguas = [] } = useQuery({ queryKey: ["yeguas"], queryFn: () => base44.entities.Yegua.list() });
  const { data: inseminaciones = [] } = useQuery({ queryKey: ["inseminaciones"], queryFn: () => base44.entities.Inseminacion.list() });
  const { data: confirmaciones = [] } = useQuery({ queryKey: ["confirmaciones"], queryFn: () => base44.entities.ConfirmacionPreñez.list() });
  const { data: partos = [] } = useQuery({ queryKey: ["partos"], queryFn: () => base44.entities.Parto.list() });
  const { data: colectas = [] } = useQuery({ queryKey: ["colectas"], queryFn: () => base44.entities.Colecta.list() });
  const { data: despachos = [] } = useQuery({ queryKey: ["despachos"], queryFn: () => base44.entities.Despacho.list() });
  const { data: inconformidades = [] } = useQuery({ queryKey: ["inconformidades"], queryFn: () => base44.entities.Inconformidad.list() });
  const { data: reproductores = [] } = useQuery({ queryKey: ["reproductores"], queryFn: () => base44.entities.Reproductor.list() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => base44.entities.User.list(), enabled: user?.role === "admin" });

  const isAdmin = user?.role === "admin";

  const lotesFiltrados = useMemo(() => {
    if (fFinca === "all") return lotes;
    return lotes.filter((l) => l.finca_id === fFinca);
  }, [lotes, fFinca]);

  const inDateRange = (fecha) => {
    if (!fecha) return true;
    if (fDesde && fecha < fDesde) return false;
    if (fHasta && fecha > fHasta) return false;
    return true;
  };

  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      if (fEspecie !== "all") {
        const esp = a.especie || "bovino";
        if (fEspecie === "bovino" && esp !== "bovino") return false;
        if (fEspecie === "ovino" && esp !== "ovino") return false;
        if (fEspecie === "equino" && esp !== "equino") return false;
      }
      if (fFinca !== "all" && a.finca_id !== fFinca) return false;
      if (fLote !== "all" && a.lote_id !== fLote) return false;
      if (fEstado !== "all" && a.estado !== fEstado) return false;
      if (fLinea !== "todos") {
        const lote = lotes.find((l) => l.id === a.lote_id);
        const tipo = lote?.tipo;
        if (fLinea === "ceba" && tipo !== "ceba") return false;
        if (fLinea === "reproduccion" && !["cria", "reproduccion", "levante"].includes(tipo)) return false;
      }
      if (isAdmin && fPropietario !== "all" && a.created_by_id !== fPropietario) return false;
      return true;
    });
  }, [animals, fEspecie, fFinca, fLote, fEstado, fLinea, lotes, isAdmin, fPropietario]);

  const filterByOwner = (item) => !isAdmin || fPropietario === "all" || item.created_by_id === fPropietario;

  const filteredGastos = useMemo(() => gastos.filter((g) => {
    if (fFinca !== "all" && g.finca_id !== fFinca) return false;
    if (fLote !== "all" && g.lote_id !== fLote) return false;
    if (fEspecie !== "all" && g.especie !== fEspecie && g.especie !== "general") return false;
    if (!inDateRange(g.fecha)) return false;
    if (!filterByOwner(g)) return false;
    return true;
  }), [gastos, fFinca, fLote, fEspecie, fDesde, fHasta, isAdmin, fPropietario]);

  const filteredVentas = useMemo(() => ventas.filter((v) => {
    if (fFinca !== "all" && v.finca_id !== fFinca) return false;
    if (fLote !== "all" && v.lote_id !== fLote) return false;
    if (fEspecie !== "all" && v.especie !== fEspecie) return false;
    if (!inDateRange(v.fecha)) return false;
    if (!filterByOwner(v)) return false;
    return true;
  }), [ventas, fFinca, fLote, fEspecie, fDesde, fHasta, isAdmin, fPropietario]);

  const filteredTratamientos = useMemo(() => tratamientos.filter((t) => {
    if (fFinca !== "all" && t.finca_id !== fFinca) return false;
    if (fLote !== "all" && t.lote_id !== fLote) return false;
    if (fEspecie !== "all" && t.especie !== fEspecie) return false;
    if (!inDateRange(t.fecha)) return false;
    if (!filterByOwner(t)) return false;
    return true;
  }), [tratamientos, fFinca, fLote, fEspecie, fDesde, fHasta, isAdmin, fPropietario]);

  const filteredProcedimientos = useMemo(() => procedimientos.filter((p) => {
    if (fFinca !== "all" && p.finca_id !== fFinca) return false;
    if (fLote !== "all" && p.lote_id !== fLote) return false;
    if (fEspecie !== "all" && p.especie !== fEspecie) return false;
    if (!inDateRange(p.fecha)) return false;
    if (!filterByOwner(p)) return false;
    return true;
  }), [procedimientos, fFinca, fLote, fEspecie, fDesde, fHasta, isAdmin, fPropietario]);

  const margenes = useMemo(() => getMargenesMinimos(user), [user]);

  // KPIs generales (bovinos/ovinos)
  const kpis = useMemo(() => {
    const activos = filteredAnimals.filter((a) => a.estado === "activo" && (a.especie === "bovino" || a.especie === "ovino" || !a.especie));
    const resultados = activos.map((a) => {
      const venta = filteredVentas.find((v) => v.animal_id === a.id);
      return calcRentabilidadCeba(a, filteredGastos, filteredTratamientos, filteredProcedimientos, venta ? [venta] : [], filteredAnimals, filteredAnimals, user);
    });
    const conDatos = resultados.filter((r) => r.costoAcumulado > 0);
    const conKg = conDatos.filter((r) => r.costoPorKgProducido != null);
    const promCostoKg = conKg.length > 0 ? conKg.reduce((s, r) => s + r.costoPorKgProducido, 0) / conKg.length : null;
    const conUtil = conDatos.filter((r) => r.utilidad != null);
    const promUtil = conUtil.length > 0 ? conUtil.reduce((s, r) => s + r.utilidad, 0) / conUtil.length : null;
    const promRent = conUtil.length > 0 ? conUtil.reduce((s, r) => s + (r.rentabilidadPct || 0), 0) / conUtil.length : null;
    const totalCosto = conDatos.reduce((s, r) => s + r.costoAcumulado, 0);
    const totalUtil = conDatos.reduce((s, r) => s + (r.utilidad ?? r.utilidadProyectada ?? 0), 0);
    return { promCostoKg, promUtil, promRent, totalCosto, totalUtil, conDatos: conDatos.length };
  }, [filteredAnimals, filteredGastos, filteredVentas, filteredTratamientos, filteredProcedimientos, user]);

  // Rentabilidad por finca
  const porFinca = useMemo(() => {
    return fincas.map((f) => {
      const animFinca = filteredAnimals.filter((a) => a.finca_id === f.id && a.estado === "activo" && (a.especie === "bovino" || a.especie === "ovino" || !a.especie));
      if (animFinca.length === 0) return null;
      const resultados = animFinca.map((a) => {
        const venta = filteredVentas.find((v) => v.animal_id === a.id);
        return calcRentabilidadCeba(a, filteredGastos, filteredTratamientos, filteredProcedimientos, venta ? [venta] : [], filteredAnimals, filteredAnimals, user);
      });
      const conDatos = resultados.filter((r) => r.costoAcumulado > 0);
      if (conDatos.length === 0) return null;
      const utilidad = conDatos.reduce((s, r) => s + (r.utilidad ?? r.utilidadProyectada ?? 0), 0);
      const costo = conDatos.reduce((s, r) => s + r.costoAcumulado, 0);
      const rentabilidad = costo > 0 ? (utilidad / costo) * 100 : null;
      return { finca: f, utilidad, costo, rentabilidad, count: conDatos.length };
    }).filter(Boolean);
  }, [fincas, filteredAnimals, filteredGastos, filteredVentas, filteredTratamientos, filteredProcedimientos, user]);

  // Ranking mejores/peores por rentabilidad
  const ranking = useMemo(() => {
    const activos = filteredAnimals.filter((a) => a.estado === "activo" && (a.especie === "bovino" || a.especie === "ovino" || !a.especie));
    const resultados = activos.map((a) => {
      const venta = filteredVentas.find((v) => v.animal_id === a.id);
      const res = calcRentabilidadCeba(a, filteredGastos, filteredTratamientos, filteredProcedimientos, venta ? [venta] : [], filteredAnimals, filteredAnimals, user);
      return { animal: a, res };
    });
    const conUtil = resultados.filter((r) => r.res.rentabilidadPct != null);
    const mejores = [...conUtil].sort((a, b) => b.res.rentabilidadPct - a.res.rentabilidadPct).slice(0, 5);
    const peores = [...conUtil].sort((a, b) => a.res.rentabilidadPct - b.res.rentabilidadPct).slice(0, 5);
    return { mejores, peores };
  }, [filteredAnimals, filteredGastos, filteredVentas, filteredTratamientos, filteredProcedimientos, user]);

  return (
    <div>
      <PageHeader title="Análisis de Rentabilidad" subtitle="Costos de producción, utilidad, margen y punto de equilibrio" />

      <Button variant="ghost" className="gap-2 mb-4" asChild>
        <Link to="/reportes"><ArrowLeft className="w-4 h-4" /> Reportes</Link>
      </Button>

      {/* Filtros */}
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Especie</Label>
            <Select value={fEspecie} onValueChange={setFEspecie}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="bovino">🐄 Bovino</SelectItem>
                <SelectItem value="ovino">🐑 Ovino</SelectItem>
                <SelectItem value="equino">🐴 Equino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Finca</Label>
            <Select value={fFinca} onValueChange={(v) => { setFFinca(v); setFLote("all"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {fincas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Lote</Label>
            <Select value={fLote} onValueChange={setFLote}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {lotesFiltrados.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Línea productiva</Label>
            <Select value={fLinea} onValueChange={setFLinea}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="ceba">Ceba / Engorde</SelectItem>
                <SelectItem value="reproduccion">Reproducción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Estado</Label>
            <Select value={fEstado} onValueChange={setFEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="vendido">Vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
          </div>
          {isAdmin && (
            <div>
              <Label className="text-xs">Propietario</Label>
              <Select value={fPropietario} onValueChange={setFPropietario}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* KPIs generales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <IndicadorCard titulo="Costo/kg producido prom." valor={kpis.promCostoKg != null ? `${formatCurrency(kpis.promCostoKg)}/kg` : "—"} subtitulo={`${kpis.conDatos} animales con datos`} icon={Scale} color="primary" />
        <IndicadorCard titulo="Utilidad prom." valor={kpis.promUtil != null ? formatCurrency(kpis.promUtil) : "—"} subtitulo="Vendidos" icon={PiggyBank} color={kpis.promUtil != null && kpis.promUtil >= 0 ? "green" : "red"} />
        <IndicadorCard titulo="Rentabilidad prom." valor={kpis.promRent != null ? `${kpis.promRent.toFixed(1)}%` : "—"} subtitulo="Animales vendidos" icon={Target} color={kpis.promRent != null ? (kpis.promRent >= (margenes.bovino ?? 15) ? "green" : kpis.promRent >= 0 ? "primary" : "red") : "gray"} />
        <IndicadorCard titulo="Utilidad total" valor={formatCurrency(kpis.totalUtil)} subtitulo={`Costo: ${formatCurrency(kpis.totalCosto)}`} icon={TrendingUp} color={kpis.totalUtil >= 0 ? "green" : "red"} />
      </div>

      {/* Rentabilidad por finca */}
      {porFinca.length > 0 && (
        <Card className="!p-4 mb-4">
          <h3 className="font-heading font-semibold mb-3">Rentabilidad por finca</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Finca</th>
                  <th className="text-right p-2 font-medium">Animales</th>
                  <th className="text-right p-2 font-medium">Costo acumulado</th>
                  <th className="text-right p-2 font-medium">Utilidad</th>
                  <th className="text-right p-2 font-medium">Rentab.</th>
                  <th className="text-center p-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {porFinca.map((f, i) => {
                  const esp = f.finca.especie || "bovino";
                  const sem = semaforoRentabilidad(f.rentabilidad, margenes[esp] ?? 15);
                  return (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-medium">{f.finca.nombre}</td>
                      <td className="p-2 text-right">{f.count}</td>
                      <td className="p-2 text-right">{formatCurrency(f.costo)}</td>
                      <td className={`p-2 text-right font-medium ${f.utilidad >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(f.utilidad)}</td>
                      <td className="p-2 text-right">{f.rentabilidad != null ? `${f.rentabilidad.toFixed(1)}%` : "—"}</td>
                      <td className="p-2 text-center"><SemaforoRentabilidad nivel={sem.color} label={sem.label} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rankings */}
      {(ranking.mejores.length > 0 || ranking.peores.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {ranking.mejores.length > 0 && (
            <Card className="!p-4">
              <h3 className="font-heading font-semibold mb-3 text-emerald-600">Mejores resultados</h3>
              <div className="space-y-2">
                {ranking.mejores.map((r, i) => {
                  const sem = semaforoRentabilidad(r.res.rentabilidadPct, margenes[r.animal.especie || "bovino"] ?? 15);
                  return (
                    <Link key={i} to={`/animales/${r.animal.id}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">#{r.animal.numero || "—"}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <SemaforoRentabilidad nivel={sem.color} label={`${r.res.rentabilidadPct.toFixed(1)}%`} />
                        <span className="text-muted-foreground">{formatCurrency(r.res.utilidad ?? r.res.utilidadProyectada ?? 0)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
          {ranking.peores.length > 0 && (
            <Card className="!p-4">
              <h3 className="font-heading font-semibold mb-3 text-red-600">Peores resultados</h3>
              <div className="space-y-2">
                {ranking.peores.map((r, i) => {
                  const sem = semaforoRentabilidad(r.res.rentabilidadPct, margenes[r.animal.especie || "bovino"] ?? 15);
                  return (
                    <Link key={i} to={`/animales/${r.animal.id}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">#{r.animal.numero || "—"}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <SemaforoRentabilidad nivel={sem.color} label={`${r.res.rentabilidadPct.toFixed(1)}%`} />
                        <span className="text-muted-foreground">{formatCurrency(r.res.utilidad ?? r.res.utilidadProyectada ?? 0)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Análisis detallado reutilizado de Reportes */}
      <Card className="!p-4">
        <h3 className="font-heading font-semibold mb-3">Análisis detallado por especie</h3>
        <CostosProduccion
          especieFilter={fEspecie === "all" ? "all" : fEspecie}
          animals={filteredAnimals}
          gastos={filteredGastos}
          ventas={filteredVentas}
          tratamientos={filteredTratamientos}
          procedimientos={filteredProcedimientos}
          lotes={lotesFiltrados}
          user={user}
          yeguas={yeguas}
          inseminaciones={inseminaciones}
          confirmaciones={confirmaciones}
          partos={partos}
          colectas={colectas}
          reproductores={reproductores}
          despachos={despachos}
          inconformidades={inconformidades}
        />
      </Card>
    </div>
  );
}