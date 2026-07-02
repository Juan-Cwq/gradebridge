import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const role = requestUrl.searchParams.get("role") || "student";
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    let user = data?.user ?? null;

    // Self-heal: if the exchange failed (e.g. the code was already consumed by
    // a duplicate navigation), a valid session may already exist on this host.
    // Treat that as success instead of bouncing the user back to /login.
    if (error || !user) {
      const { data: userData } = await supabase.auth.getUser();
      user = userData?.user ?? null;
      if (!user) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`, {
          status: 303,
        });
      }
    }

    // Check for existing profile
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Create profile if it doesn't exist
    if (!existingProfile) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url,
        role: role as "teacher" | "student",
        onboarding_completed: false,
      });
    }

    const userRole = existingProfile?.role || role;
    const dashboardPath = userRole === "teacher" ? "/teacher" : "/student";

    // Use 307 redirect to preserve cookies
    return NextResponse.redirect(`${origin}${dashboardPath}`, {
      status: 307,
    });
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`, {
    status: 307,
  });
}
