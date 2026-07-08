import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Solo administradores pueden eliminar datos demo' }, { status: 403 });

    const DEMO_MARKER = "DATOS DEMO RJAPP";
    const counts = {};

    // Entidades a limpiar (orden: hijos primero, padres después)
    const entidades = [
      "Pesaje", "Tratamiento", "Procedimiento", "Gasto", "Venta",
      "Inseminacion", "ConfirmacionPreñez", "RepeticionCelo", "Parto", "Cria",
      "Colecta", "Despacho", "Inconformidad", "ServicioInterno",
      "EventoCalendario", "Proforma", "Cliente",
      "Yegua", "Reproductor", "Animal", "Lote", "Finca"
    ];

    const admin = base44.asServiceRole;

    for (const entityName of entidades) {
      try {
        const records = await admin.entities[entityName].list('-created_date', 1000);
        const demoIds = records
          .filter(r => r.observaciones && typeof r.observaciones === 'string' && r.observaciones.includes(DEMO_MARKER))
          .map(r => r.id);

        if (demoIds.length === 0) {
          counts[entityName] = 0;
          continue;
        }

        // Intentar deleteMany con $in (una sola llamada)
        let deleted = false;
        try {
          await admin.entities[entityName].deleteMany({ id: { $in: demoIds } });
          deleted = true;
        } catch (e) {
          // Fallback: eliminar en paralelo con Promise.all
          await Promise.all(demoIds.map(id => admin.entities[entityName].delete(id)));
          deleted = true;
        }

        counts[entityName] = deleted ? demoIds.length : 0;
      } catch (e) {
        counts[entityName] = `error: ${e.message}`;
      }
    }

    const totalEliminados = Object.values(counts).reduce((s, v) => typeof v === 'number' ? s + v : s, 0);

    return Response.json({
      success: true,
      message: `Datos demo eliminados correctamente. ${totalEliminados} registros eliminados. Los datos reales no fueron afectados.`,
      counts,
      totalEliminados
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});