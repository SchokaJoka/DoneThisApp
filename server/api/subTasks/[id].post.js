import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  // verify session
  const { data: { session } = {}, error: sessionErr } =
    await client.auth.getSession();
  if (sessionErr || !session || !session.access_token) {
    console.error("[api/subTasks/[taskId].post] missing session:", sessionErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } =
    await client.auth.getUser(session.access_token);
  if (verifyErr || !verifiedUser) {
    console.error("[api/subTasks/[taskId].post] failed to verify user:", verifyErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // Get task_id from URL parameter
  const taskId = getRouterParam(event, 'id');
  if (!taskId) {
    throw createError({ statusCode: 400, statusMessage: "taskId is required" });
  }

  // verify task ownership
  const { data: task, error: taskErr } = await client
    .from("tasks")
    .select("user_id")
    .eq("id", taskId)
    .single();

  if (taskErr || !task) {
    throw createError({ statusCode: 404, statusMessage: "Task not found" });
  }
  if (task.user_id !== verifiedUser.id) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: not your task" });
  }

  // Get subtasks array from body
  const body = await readBody(event);
  const subtasks = Array.isArray(body) ? body : body.subtasks || [];

  if (subtasks.length === 0) {
    return []; // Return empty array if no subtasks provided
  }

  // get current max order for this task
  const { data: existingSubtasks } = await client
    .from("sub_tasks")
    .select("order")
    .eq("task_id", taskId)
    .order("order", { ascending: false })
    .limit(1);

  let nextOrder = existingSubtasks && existingSubtasks.length > 0
    ? (existingSubtasks[0].order ?? 0) + 1
    : 0;

  // Build array of subtasks to insert (without task_id in each object - we use the URL param)
  const newSubTasks = subtasks.map((st, index) => ({
    task_id: taskId,
    user_id: verifiedUser.id,
    name: st.name || null,
    order: st.order ?? (nextOrder + index),
    status: st.status ?? 0,
  }));

  const { data, error } = await client
    .from("sub_tasks")
    .insert(newSubTasks)
    .select();

  if (error) {
    console.error("[api/subTasks/[taskId].post] supabase error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to create subtask(s)",
    });
  }

  return data;
});
