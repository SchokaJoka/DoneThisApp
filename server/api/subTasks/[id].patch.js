import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  // verify session
  const { data: { session } = {}, error: sessionErr } =
    await client.auth.getSession();
  if (sessionErr || !session || !session.access_token) {
    console.error("[api/subTasks/[subTaskId].patch] missing session:", sessionErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } =
    await client.auth.getUser(session.access_token);
  if (verifyErr || !verifiedUser) {
    console.error("[api/subTasks/[subTaskId].patch] failed to verify user:", verifyErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { id } = event.context.params || {};
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "subTaskId is required" });

  const body = await readBody(event);
  const updates = body.updates;

  if (!updates || Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No updates provided" });
  }

  // ensure ownership
  const { data: existing, error: fetchErr } = await client
    .from("sub_tasks")
    .select("user_id, task_id, order")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    throw createError({ statusCode: 404, statusMessage: "SubTask not found" });
  }
  if (existing.user_id !== verifiedUser.id) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: not your subtask" });
  }

  const oldOrder = existing.order;
  const newOrder = updates.order;

  // handle order reordering if order is being updated
  if (newOrder !== undefined && newOrder !== oldOrder) {
    // get all subtasks for this task
    const { data: allSubtasks, error: fetchAllErr } = await client
      .from("sub_tasks")
      .select("id, order")
      .eq("task_id", existing.task_id)
      .order("order", { ascending: true });

    if (fetchAllErr) {
      console.error("[api/subTasks/[subTaskId].patch] error fetching subtasks:", fetchAllErr);
      throw createError({ statusCode: 500, statusMessage: "Failed to fetch subtasks for reordering" });
    }

    // reorder other subtasks
    for (const subtask of allSubtasks) {
      if (subtask.id === id) continue;

      let updatedOrder = subtask.order;

      if (oldOrder < newOrder) {
        // moving down: shift items between old and new position up
        if (subtask.order > oldOrder && subtask.order <= newOrder) {
          updatedOrder = subtask.order - 1;
        }
      } else {
        // moving up: shift items between new and old position down
        if (subtask.order >= newOrder && subtask.order < oldOrder) {
          updatedOrder = subtask.order + 1;
        }
      }

      if (updatedOrder !== subtask.order) {
        await client
          .from("sub_tasks")
          .update({ order: updatedOrder, updated_at: new Date().toISOString() })
          .eq("id", subtask.id);
      }
    }
  }

  // update the subtask with all provided updates
  updates.updated_at = new Date().toISOString();

  const { data, error } = await client
    .from("sub_tasks")
    .update({ ...updates })
    .eq("id", id)
    .select();

  if (error) {
    console.error("[api/subTasks/[subTaskId].patch] supabase error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to update subtask",
    });
  }

  return data?.[0] ?? null;
});
