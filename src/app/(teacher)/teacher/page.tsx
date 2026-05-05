import { createClient } from "@/lib/supabase/server";
import TeacherDashboardClient from "@/components/teacher/TeacherDashboardClient";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { count: classCount },
    { count: studentCount },
    { data: classes },
    { data: recentActivity },
    { count: aiContentCount },
  ] = await Promise.all([
    supabase.from("classes").select("*", { count: "exact", head: true }).eq("teacher_id", user!.id).eq("is_archived", false),
    supabase.from("students").select("*", { count: "exact", head: true }).eq("teacher_id", user!.id).eq("is_active", true),
    supabase.from("classes").select(`
      *,
      assignments(id, name, due_date, is_published),
      enrollments(id)
    `).eq("teacher_id", user!.id).eq("is_archived", false).order("created_at", { ascending: false }),
    supabase.from("grades").select(`
      id,
      created_at,
      status,
      student:students(first_name, last_name),
      assignment:assignments(name, class:classes(name))
    `).order("created_at", { ascending: false }).limit(10),
    supabase.from("ai_content").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
  ]);

  const pendingGrades = classes?.reduce((acc, cls) => {
    const pendingAssignments = cls.assignments?.filter(
      (a: { is_published: boolean | null; due_date: string | null }) => 
        a.is_published && a.due_date && new Date(a.due_date) < new Date()
    ).length || 0;
    return acc + pendingAssignments;
  }, 0) || 0;

  const stats = {
    activeClasses: classCount || 0,
    studentsEnrolled: studentCount || 0,
    pendingGrades: pendingGrades,
    aiLessonsGenerated: aiContentCount || 0,
  };

  return (
    <TeacherDashboardClient
      stats={stats}
      classes={classes || []}
      recentActivity={recentActivity || []}
    />
  );
}
