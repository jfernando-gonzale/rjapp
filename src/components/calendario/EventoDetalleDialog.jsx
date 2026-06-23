import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CATEGORIAS, ESTADO_LABELS, ESPECIE_LABELS } from "@/lib/calendario";

// Modal para ver detalle y cambiar estado de un evento (derivado o manual).
export default function EventoDetalleDialog({
  evento,
  open,
  onOpenChange,
  onMarcarEstado,
  onEditar,
  onEliminar,
}) {
  if (!evento) return null;
  const Icon = evento.icon;
  const cat = CATEGORIAS[evento.tipo_evento] || CATEGORIAS.tarea;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${evento.color}-600`} />
            {evento.titulo}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categoría</span>
            <span className="font-medium">{cat.label}</span>
          </div>
          {evento.especie && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Especie</span>
              <span className="font-medium">{ESPECIE_LABELS[evento.especie] || evento.especie}</span>
            </div>
          )}
          {evento.finca && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Finca</span>
              <span className="font-medium">{evento.finca}</span>
            </div>
          )}
          {(evento.lote || evento.animal) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sujeto</span>
              <span className="font-medium">{evento.lote || `#${evento.animal}`}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium">{evento.fecha}{evento.hora ? ` ${evento.hora}` : ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <span className="font-medium">{ESTADO_LABELS[evento.estado] || evento.estado}</span>
          </div>
          {evento.responsable && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Responsable</span>
              <span className="font-medium">{evento.responsable}</span>
            </div>
          )}
          {evento.observaciones && (
            <div className="pt-2 border-t border-border">
              <p className="text-muted-foreground text-xs mb-1">Observaciones</p>
              <p>{evento.observaciones}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {evento.estado !== "completado" && (
            <Button onClick={() => onMarcarEstado(evento, "completado")} className="w-full">
              Marcar como completado
            </Button>
          )}
          {evento.estado === "pendiente" && (
            <Button variant="outline" onClick={() => onMarcarEstado(evento, "reprogramado")} className="w-full">
              Reprogramar
            </Button>
          )}
          {evento.estado !== "cancelado" && (
            <Button variant="outline" onClick={() => onMarcarEstado(evento, "cancelado")} className="w-full">
              Cancelar evento
            </Button>
          )}
          {!evento.es_derivado && (
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => onEditar(evento)}>Editar</Button>
              <Button variant="ghost" className="flex-1 text-destructive" onClick={() => onEliminar(evento)}>Eliminar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}