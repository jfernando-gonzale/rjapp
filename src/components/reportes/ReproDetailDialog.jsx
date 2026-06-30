import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

export default function ReproDetailDialog({ open, onClose, title, subtitle, items }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay animales en esta categoría.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">#{item.numero}</span>
                    {item.nombre && <span className="text-sm text-muted-foreground">· {item.nombre}</span>}
                    {item.especie && <span className="text-xs px-1.5 py-0.5 rounded bg-muted capitalize">{item.especie}</span>}
                    {item.estadoReproductivo && item.estadoReproductivo !== "—" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 capitalize">{item.estadoReproductivo}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.finca && <span>Finca: {item.finca}</span>}
                    {item.lote && <span> · Lote: {item.lote}</span>}
                  </div>
                  <div className="text-xs mt-1">
                    <span className="text-amber-600 font-medium">Motivo: </span>
                    <span>{item.motivo}</span>
                  </div>
                  {(item.fechaRelevante || item.diasLabel) && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.fechaLabel && <span>{item.fechaLabel}</span>}
                      {item.diasLabel && <span> · {item.diasLabel}</span>}
                    </div>
                  )}
                  {item.accionSugerida && (
                    <div className="text-xs mt-0.5">
                      <span className="text-blue-600 font-medium">Acción sugerida: </span>
                      <span>{item.accionSugerida}</span>
                    </div>
                  )}
                </div>
                {item.link && (
                  <Button asChild size="sm" variant="outline" className="gap-1 shrink-0">
                    <Link to={item.link}><ExternalLink className="w-3.5 h-3.5" /> Ver hoja de vida</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}