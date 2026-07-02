import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden - Admin only' }, { status: 403 });

    // Parse body (may be empty for GET-like calls)
    let body = {};
    try { body = await req.json(); } catch (e) { /* empty body is fine */ }
    const entityName = body.entity_name;

    // List all users for the dropdown
    const users = await base44.asServiceRole.entities.User.list();
    const userList = users.map(u => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role }));

    if (entityName) {
      const entityRef = base44.asServiceRole.entities[entityName];
      if (!entityRef) return Response.json({ error: `Entity ${entityName} not found` }, { status: 404 });

      const records = await entityRef.list();
      const recordsWithOwner = records.map(r => ({
        id: r.id,
        created_by_id: r.created_by_id,
        created_date: r.created_date,
        display: r.nombre || r.numero || r.titulo || r.descripcion || r.id,
        owner_email: users.find(u => u.id === r.created_by_id)?.email || 'Sin propietario'
      }));

      return Response.json({ users: userList, records: recordsWithOwner, entity_name: entityName });
    }

    return Response.json({ users: userList });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});