import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, Database, ArrowRight, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ENTITIES = [
  "Finca", "Lote", "Animal", "Yegua", "Reproductor", "Cria",
  "Pesaje", "Tratamiento", "Procedimiento", "Gasto", "Venta",
  "Proforma", "Cliente", "Despacho", "Colecta", "Inconformidad",
  "Inseminacion", "ConfirmacionPreñez", "Parto", "RepeticionCelo",
  "ServicioInterno", "EventoCalendario"
];

export default function ReasignarPropietario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetUser, setTargetUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("listAllDataForAdmin", {});
      setUsers(res.data.users || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setLoading(false);
  };

  const loadRecords = async (entityName) => {
    setSelectedEntity(entityName);
    setSelectedIds([]);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("listAllDataForAdmin", { entity_name: entityName });
      setRecords(res.data.records || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setLoading(false);
  };

  const toggleRecord = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.length === records.length ? [] : records.map(r => r.id));
  };

  const handleReassign = async () => {
    if (!targetUser || selectedIds.length === 0) return;
    setReassigning(true);
    try {
      const res = await base44.functions.invoke("reassignOwnership", {
        entity_name: selectedEntity,
        record_ids: selectedIds,
        new_user_id: targetUser
      });
      toast({ title: "Reasignación exitosa", description: `${res.data.reassigned} registro(s) reasignado(s)` });
      setSelectedIds([]);
      await loadRecords(selectedEntity);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
    setReassigning(false);
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-heading font-bold">Acceso restringido</h2>
          <p className="text-sm text-muted-foreground mt-1">Solo los administradores pueden acceder a esta herramienta.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold flex items-center gap-2">
          <Shield className="w-7 h-7" /> Reasignar Propietario
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Herramienta administrativa para reasignar la propiedad de registros entre usuarios.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Esta herramienta modifica el propietario de los registros. Los datos existentes no se borran,
          solo cambia quién puede verlos. Úsala con precaución.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4" /> 1. Seleccionar módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEntity} onValueChange={loadRecords}>
              <SelectTrigger><SelectValue placeholder="Elegir entidad..." /></SelectTrigger>
              <SelectContent>
                {ENTITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> 2. Reasignar a usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={targetUser} onValueChange={setTargetUser}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar usuario destino..." /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.role === "admin" ? "(Admin)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleReassign}
                disabled={!targetUser || selectedIds.length === 0 || reassigning}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                {reassigning ? "Reasignando..." : `Reasignar ${selectedIds.length > 0 ? `(${selectedIds.length})` : ""}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedEntity && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Registros de {selectedEntity} ({records.length})</CardTitle>
            {records.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedIds.length === records.length ? "Deseleccionar todo" : "Seleccionar todo"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay registros en esta entidad.</p>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {records.map(r => (
                  <label key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
                    <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={() => toggleRecord(r.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.display}</p>
                      <p className="text-xs text-muted-foreground">Propietario: {r.owner_email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}