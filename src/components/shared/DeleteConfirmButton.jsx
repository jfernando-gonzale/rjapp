import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Botón reutilizable para eliminar registros con confirmación.
 *
 * Props:
 *   entityName: string         — nombre de la entidad en base44.entities (ej: "Tratamiento")
 *   recordId: string           — id del registro a eliminar
 *   recordLabel: string        — etiqueta para mostrar en el diálogo (ej: "el tratamiento #5")
 *   warningText: string        — texto de advertencia personalizado
 *   queryKeysToInvalidate: array — query keys a invalidar tras eliminar (ej: ["tratamientos"])
 *   variant: string            — variante del botón (default: "ghost")
 *   size: string               — tamaño del botón (default: "icon")
 *   iconOnly: boolean          — si true, solo muestra el icono; si false, muestra icono + "Eliminar"
 *   className: string          — clases adicionales
 *   onDeleted: function        — callback tras eliminar exitosamente
 *   disabled: boolean          — deshabilitar el botón
 */
export default function DeleteConfirmButton({
  entityName,
  recordId,
  recordLabel = "este registro",
  warningText,
  queryKeysToInvalidate = [],
  variant = "ghost",
  size = "icon",
  iconOnly = true,
  className = "",
  onDeleted,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities[entityName].delete(recordId),
    onSuccess: () => {
      queryKeysToInvalidate.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      toast.success("Registro eliminado");
      setOpen(false);
      if (onDeleted) onDeleted();
    },
    onError: (error) => {
      toast.error("Error al eliminar: " + (error.message || "intente nuevamente"));
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 text-red-600 hover:text-red-700 hover:bg-red-50 ${
            size === "icon" ? "h-8 w-8" : "h-9 px-3 py-2"
          } ${className}`}
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
          {!iconOnly && "Eliminar"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {recordLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            {warningText ||
              "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}