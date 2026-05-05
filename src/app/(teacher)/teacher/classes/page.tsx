import { createClient } from "@/lib/supabase/server";
import ClassesListClient from "@/components/teacher/ClassesListClient";

export default async function ClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: classes } = await supabase
    .from("classes")
    .select(`
      *,
      assignments(id),
      enrollments(id, user_id, student_id)
    `)
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  return <ClassesListClient classes={classes || []} />;
}
