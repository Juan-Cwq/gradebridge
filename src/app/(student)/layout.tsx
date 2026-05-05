import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "teacher") {
    redirect("/teacher");
  }

  return (
    <div className="min-h-screen bg-base-200">
      <StudentSidebar profile={profile} />
      <div className="lg:pl-64">
        <StudentHeader profile={profile} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
