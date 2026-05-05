import { createClient } from "@/lib/supabase/server";
import StudentDashboardClient from "@/components/student/StudentDashboardClient";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      class:classes(
        id,
        name,
        color,
        period,
        subject,
        teacher:profiles(full_name),
        assignments(id, name, due_date, points_possible, is_published)
      )
    `)
    .eq("user_id", user!.id)
    .eq("is_active", true);

  const classes = enrollments?.map((e) => e.class).filter(Boolean) || [];

  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  const allAssignments = classes.flatMap((cls: { 
    id: string; 
    name: string; 
    color: string | null;
    teacher: { full_name: string | null } | null;
    assignments: { 
      id: string; 
      name: string; 
      due_date: string | null; 
      points_possible: number; 
      is_published: boolean | null 
    }[] 
  }) =>
    (cls.assignments || [])
      .filter((a: { is_published: boolean | null }) => a.is_published)
      .map((a: { id: string; name: string; due_date: string | null; points_possible: number }) => ({
        ...a,
        className: cls.name,
        classColor: cls.color,
        classId: cls.id,
        teacherName: cls.teacher?.full_name || "Unknown Teacher",
      }))
  );

  const dueThisWeek = allAssignments.filter(
    (a) => a.due_date && new Date(a.due_date) <= oneWeekFromNow && new Date(a.due_date) >= new Date()
  );

  const { count: aiSessionsCount } = await supabase
    .from("ai_content")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("content_type", "tutor_session");

  const classIds = classes.map((c: { id: string }) => c.id);
  
  let announcements: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    is_pinned: boolean | null;
    class: { id: string; name: string; color: string | null } | null;
  }[] = [];
  
  if (classIds.length > 0) {
    const { data: announcementsData } = await supabase
      .from("announcements")
      .select(`
        id,
        title,
        content,
        created_at,
        is_pinned,
        class:classes(id, name, color)
      `)
      .in("class_id", classIds)
      .order("created_at", { ascending: false })
      .limit(5);
    
    announcements = announcementsData || [];
  }

  const stats = {
    enrolledClasses: classes.length,
    dueThisWeek: dueThisWeek.length,
    overallAverage: 0,
    aiTutorSessions: aiSessionsCount || 0,
  };

  return (
    <StudentDashboardClient
      stats={stats}
      classes={classes}
      assignments={allAssignments}
      announcements={announcements}
    />
  );
}
