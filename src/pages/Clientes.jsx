import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Phone, MapPin, User, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { TIPO_CLIENTE } from "@/lib/helpers";
import CsvExportButton from "@/components/shared/CsvExportButton";
import ImportCsvDialog from "@/components/shared/ImportCsvDialog";
import DepartamentoMunicipioFields from "@/components/shared/DepartamentoMunicipioFields";
import DeleteConfirmButton from "@/components/shared/DeleteConfirmButton";

const TIPO_COLORS = {
  bovinos: "bg-amber-100 text-amber-800",
  ovinos: "bg-green-100 text-green-800",
  equinos: "bg-blue-100 text-blue-800",
  semen_equino: "bg-purple-100 text-purple-800",
  general: "bg-gray-100 text-gray-600",
};

const emptyForm = { nombre: "", telefono: "", ciudad: "", departamento: "", finca_criadero: "", tipo_cliente: "general", observaciones: "" };

export default function Clientes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => base44.entities.Cliente.list("-created_date"),
  });

  const save = useMutation({
    mutationFn: async (data) => {
      if (editing) return base44.entities.Cliente.update(editing, data);
      return base44.entities.Cliente.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
      toast({ title: editing ? "Cliente actualizado" : "Cliente registrado" });
    },
  });

  const filtered = useMemo(() => clientes.filter(c => {
    if (filterTipo !== "all" && c.tipo_cliente !== filterTipo) return false;
    if (search && !c.nombre?.toLowerCase().includes(search.toLowerCase()) && !c.ciudad?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [clientes, filterTipo, search]);

  const openNew = () => { setForm(emptyForm); setEditing(null); setOpen(true); };

  const handleImportClientes = async (rows) => {
    const existentes = new Set(clientes.map((c) => (c.nombre || "").toLowerCase()));
    const nuevos = rows.filter((r) => r.nombre && !existentes.has(r.nombre.toLowerCase())).map((r) => ({
      nombre: r.nombre, telefono: r.telefono, ciudad: r.ciudad,
      departamento: r.departamento, finca_criadero: r.finca_criadero,
      tipo_cliente: r.tipo_cliente || "general",
    }));
    if (nuevos.length) await base44.entities.Cliente.bulkCreate(nuevos);
    qc.invalidateQueries({ queryKey: ["clientes"] });
  };
  const openEdit = (c) => { setForm({ ...c }); setEditing(c.id); setOpen(true); };

  return (
    <div className="space-y-5">
      <PageHeader title="Clientes" subtitle="Gestión de clientes por línea de negocio" actionLabel="Nuevo Cliente" onAction={openNew}>
        <CsvExportButton data={filtered} filename="clientes" columns={[
          { key: "nombre", label: "Nombre" }, { key: "telefono", label: "Teléfono" },
          { key: "ciudad", label: "Ciudad" }, { key: "departamento", label: "Departamento" },
          { key: "finca_criadero", label: "Finca/Criadero" }, { key: "tipo_cliente", label: "Tipo" },
        ]} />
        <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => setImportOpen(true)}><Layers className="w-4 h-4" /> Importar</Button>
      </PageHeader>

      {/* Filtro por tipo */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todos" },
          { key: "bovinos", label: "🐄 Bovinos" },
          { key: "ovinos", label: "🐑 Ovinos" },
          { key: "equinos", label: "🐴 Equinos" },
          { key: "semen_equino", label: "💉 Semen Equino" },
          { key: "general", label: "General" },
        ].map(t => (
          <button key={t.key} onClick={() => setFilterTipo(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterTipo === t.key ? "bg-amber-500 text-black border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
            }`}>{t.label}</button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No hay clientes registrados</p>
          <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Registrar primer cliente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => openEdit(c)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-semibold truncate">{c.nombre}</h3>
                    {c.tipo_cliente && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${TIPO_COLORS[c.tipo_cliente] || "bg-gray-100 text-gray-600"}`}>
                        {TIPO_CLIENTE[c.tipo_cliente] || c.tipo_cliente}
                      </span>
                    )}
                  </div>
                  {c.telefono && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {c.telefono}
                    </p>
                  )}
                  {(c.ciudad || c.departamento) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {[c.ciudad, c.departamento].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {c.finca_criadero && <p className="text-xs text-muted-foreground mt-1 truncate">{c.finca_criadero}</p>}
                </div>
                <DeleteConfirmButton entityName="Cliente" recordId={c.id} recordLabel={`el cliente "${c.nombre}"`} queryKeysToInvalidate={["clientes"]} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del cliente" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Tipo de cliente / Línea</Label>
                <Select value={form.tipo_cliente} onValueChange={v => setForm(p => ({ ...p, tipo_cliente: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CLIENTE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="Ej: 3001234567" />
              </div>
              <DepartamentoMunicipioFields
                departamento={form.departamento}
                municipio={form.ciudad}
                onChangeDepartamento={(v) => setForm(p => ({ ...p, departamento: v }))}
                onChangeMunicipio={(v) => setForm(p => ({ ...p, ciudad: v }))}
                labels={{ departamento: "Departamento", municipio: "Ciudad / Municipio" }}
              />
              <div className="space-y-1.5">
                <Label>Finca / Criadero</Label>
                <Input value={form.finca_criadero} onChange={e => setForm(p => ({ ...p, finca_criadero: e.target.value }))} placeholder="Nombre del criadero" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} placeholder="Notas adicionales..." rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                onClick={() => save.mutate(form)}
                disabled={!form.nombre || save.isPending}
              >
                {save.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} fields={[
        { key: "nombre", label: "Nombre", required: true },
        { key: "telefono", label: "Teléfono" },
        { key: "ciudad", label: "Ciudad" },
        { key: "departamento", label: "Departamento" },
        { key: "finca_criadero", label: "Finca/Criadero" },
        { key: "tipo_cliente", label: "Tipo cliente" },
      ]} onImport={handleImportClientes} entityLabel="clientes" />
    </div>
  );
}