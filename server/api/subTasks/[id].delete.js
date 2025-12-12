import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  // verify session
  const { data: { session } = {}, error: sessionErr } =
    await client.auth.getSession();
  if (sessionErr || !session || !session.access_token) {
    console.error("[api/subTasks/[subTaskId].delete] missing session:", sessionErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } =
    await client.auth.getUser(session.access_token);
  if (verifyErr || !verifiedUser) {
    console.error("[api/subTasks/[subTaskId].delete] failed to verify user:", verifyErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { id } = event.context.params || {};
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "subTaskId is required" });

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

  // delete the subtask
  const { error } = await client
    .from("sub_tasks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[api/subTasks/[subTaskId].delete] supabase error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to delete subtask",
    });
  }

  // reorder remaining subtasks to fill the gap
  const { data: remainingSubtasks, error: fetchRemainingErr } = await client
    .from("sub_tasks")
    .select("id, order")
    .eq("task_id", existing.task_id)
    .order("order", { ascending: true });

  if (!fetchRemainingErr && remainingSubtasks) {
    // update order for each remaining subtask
    for (let i = 0; i < remainingSubtasks.length; i++) {
      if (remainingSubtasks[i].order !== i) {
        await client
          .from("sub_tasks")
          .update({ order: i, updated_at: new Date().toISOString() })
          .eq("id", remainingSubtasks[i].id);
      }
    }
  }

  return { success: true, id: id };
});
