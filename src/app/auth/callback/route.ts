import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const role = requestUrl.searchParams.get("role") || "student";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
          avatar_url: data.user.user_metadata?.avatar_url,
          role: role as "teacher" | "student",
          onboarding_completed: false,
        });
      }

      const userRole = existingProfile?.role || role;
      const dashboardPath = userRole === "teacher" ? "/teacher" : "/student";
      return NextResponse.redirect(`${origin}${dashboardPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
