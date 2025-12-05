import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  // verify session
  const { data: { session } = {}, error: sessionErr } =
    await client.auth.getSession();
  if (sessionErr || !session || !session.access_token) {
    console.error("[api/subTasks/[taskId].get] missing session:", sessionErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { data: { user: verifiedUser } = {}, error: verifyErr } =
    await client.auth.getUser(session.access_token);
  if (verifyErr || !verifiedUser) {
    console.error("[api/subTasks/[taskId].get] failed to verify user:", verifyErr);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { id } = event.context.params;
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "taskId is required" });

  // verify task ownership first
  const { data: task, error: taskErr } = await client
    .from("tasks")
    .select("user_id")
    .eq("id", id)
    .single();

  if (taskErr || !task) {
    throw createError({ statusCode: 404, statusMessage: "Task not found" });
  }
  if (task.user_id !== verifiedUser.id) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: not your task" });
  }

  // get all subtasks for this task, ordered by order
  const { data, error } = await client
    .from("sub_tasks")
    .select("*")
    .eq("task_id", id)
    .order("order", { ascending: true });

  if (error) {
    console.error("[api/subTasks/[taskId].get] supabase error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to fetch subtasks",
    });
  }

  return data;
});