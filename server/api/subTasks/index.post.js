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

  if (!body.task_id) {
    throw createError({ statusCode: 400, statusMessage: "task_id is required" });
  }

  // verify task ownership
  const { data: task, error: taskErr } = await client
    .from("tasks")
    .select("user_id")
    .eq("id", body.task_id)
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
    .eq("task_id", body.task_id)
    .order("order", { ascending: false })
    .limit(1);

  const nextOrder = existingSubtasks && existingSubtasks.length > 0
    ? (existingSubtasks[0].order ?? 0) + 1
    : 0;

  const newSubTask = {
    task_id: body.task_id,
    user_id: verifiedUser.id,
    name: body.name || null,
    order: body.order ?? nextOrder,
    status: body.status ?? 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("sub_tasks")
    .insert(newSubTask)
    .select()
    .single();

  if (error) {
    console.error("[api/subTasks/index.post] supabase error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to create subtask",
    });
  }

  return data;
});
