import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  // verify session
  const { data: { session } = {}, error: sessionErr } =
    await client.auth.getSession();
  if (sessionErr || !session || !session.access_token) {
    console.error("[api/subTasks/index.post] missing session:", sessionErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } =
    await client.auth.getUser(session.access_token);
  if (verifyErr || !verifiedUser) {
    console.error("[api/subTasks/index.post] failed to verify user:", verifyErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);

  // Support both single subtask and array of subtasks
  const subtasks = Array.isArray(body) ? body : [body];

  if (subtasks.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No subtasks provided" });
  }

  // Get task_id from first subtask (all should have same task_id)
  const task_id = subtasks[0].task_id;
  if (!task_id) {
    throw createError({ statusCode: 400, statusMessage: "task_id is required" });
  }

  // verify task ownership
  const { data: task, error: taskErr } = await client
    .from("tasks")
    .select("user_id")
    .eq("id", task_id)
    .single();

  if (taskErr || !task) {
    throw createError({ statusCode: 404, statusMessage: "Task not found" });
  }
  if (task.user_id !== verifiedUser.id) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: not your task" });
  }

  // get current max order for this task
  const { data: existingSubtasks } = await client
    .from("sub_tasks")
    .select("order")
    .eq("task_id", task_id)
    .order("order", { ascending: false })
    .limit(1);

  let nextOrder = existingSubtasks && existingSubtasks.length > 0
    ? (existingSubtasks[0].order ?? 0) + 1
    : 0;

  // Build array of subtasks to insert
  const newSubTasks = subtasks.map((st, index) => ({
    task_id: task_id,
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
    console.error("[api/subTasks/index.post] supabase error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to create subtask(s)",
    });
  }

  // Return single object if single input, array if array input
  return Array.isArray(body) ? data : data[0];
});
