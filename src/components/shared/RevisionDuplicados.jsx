import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { normalizeNumero } from "@/lib/duplicados";
import { ESTADO_ANIMAL, ESPECIES } from "@/lib/helpers";
import { Copy, AlertTriangle, ExternalLink } from "lucide-react";

/**
 * Sección de revisión manual de posibles duplicados (solo lectura).
 * Agrupa animales del usuario actual que comparten número/chapeta dentro de
 * la misma especie y finca. No elimina nada automáticamente.
 */
export default function RevisionDuplicados() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: fincas = [] } = useQuery({ queryKey: ["fincas"], queryFn: () => base44.entities.Finca.list() });
  const { data: animales = [], isLoading } = useQuery({ queryKey: ["animals"], queryFn: () => base44.entities.Animal.list() });

  const fincaNombre = (id) => fincas.find((f) => f.id === id)?.nombre || "Sin finca";

  const grupos = useMemo(() => {
    const mios = (animales || []).filter((a) => a.created_by_id === user?.id && a.numero);
    const map = new Map();
    mios.forEach((a) => {
      const key = `${a.especie || ""}|${a.finca_id || ""}|${normalizeNumero(a.numero)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    const dups = [];
    map.forEach((list, key) => {
      if (list.length > 1) {
        const [especie, fincaId] = key.split("|");
        const ordenados = [...list].sort((x, y) =>
          String(x.created_date || "").localeCompare(String(y.created_date || ""))
        );
        dups.push({ especie, fincaId, numero: ordenados[0].numero, animales: ordenados });
      }
    });
    return dups.sort((a, b) => a.especie.localeCompare(b.especie));
  }, [animales, user]);

  return (
    <Card className="p-5 space-y-4 mb-4 border-amber-200">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h2 className="font-heading font-semibold">Revisión de datos · Posibles duplicados</h2>
          <p className="text-sm text-muted-foreground">
            Animales que comparten el mismo número/chapeta dentro de la misma especie y finca.
            Solo para revisión manual — no se elimina nada automáticamente.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : grupos.length === 0 ? (
        <div className="text-center py-6 text-sm text-emerald-700 bg-emerald-50 rounded-lg">
          ✓ No se encontraron posibles duplicados en tu inventario.
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((g, gi) => (
            <div key={gi} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="text-sm">
                  <span className="font-semibold">{ESPECIES[g.especie] || g.especie || "—"}</span>
                  <span className="text-muted-foreground"> · Finca: {fincaNombre(g.fincaId)} · N° </span>
                  <span className="font-mono font-semibold">{g.numero}</span>
                </div>
                <span className="text-xs text-amber-600 font-medium">{g.animales.length} animales</span>
              </div>
              <div className="space-y-1.5">
                {g.animales.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm bg-white rounded px-3 py-1.5 border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">#{a.numero}</span>
                      {a.nombre && <span className="text-muted-foreground">({a.nombre})</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.estado === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {ESTADO_ANIMAL[a.estado] || a.estado}
                      </span>
                      <span className="text-xs text-muted-foreground">Creado: {a.created_date?.split("T")[0] || "—"}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/animales/${a.id}`)} className="gap-1 h-7 text-xs">
                      Ver hoja de vida <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}