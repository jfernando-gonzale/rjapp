import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden - Admin only' }, { status: 403 });

    const body = await req.json();
    const { entity_name, record_ids, new_user_id } = body;

    if (!entity_name || !record_ids || !Array.isArray(record_ids) || record_ids.length === 0 || !new_user_id) {
      return Response.json({ error: 'entity_name, record_ids (array), and new_user_id are required' }, { status: 400 });
    }

    // Get target user email for the created_by field
    const users = await base44.asServiceRole.entities.User.list();
    const targetUser = users.find(u => u.id === new_user_id);
    if (!targetUser) return Response.json({ error: 'Target user not found' }, { status: 404 });

    // Reassign ownership using asServiceRole to bypass RLS
    // We update created_by_id to the new user's ID
    const entityRef = base44.asServiceRole.entities[entity_name];
    if (!entityRef) return Response.json({ error: `Entity ${entity_name} not found` }, { status: 404 });

    let reassigned = 0;
    for (const recordId of record_ids) {
      try {
        await entityRef.update(recordId, { created_by_id: new_user_id });
        reassigned++;
      } catch (e) {
        // continue with next record
      }
    }

    return Response.json({
      success: true,
      entity_name,
      reassigned,
      requested: record_ids.length,
      new_owner: { id: targetUser.id, email: targetUser.email, full_name: targetUser.full_name }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});