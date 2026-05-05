"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthResult = {
  error?: string;
  success?: boolean;
};

export async function signUp(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as "teacher" | "student";
  const schoolCode = formData.get("schoolCode") as string | null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
        school_code: schoolCode,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?role=${role}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if email confirmation is required
  // If session is null but user exists, email confirmation is pending
  if (data.user && !data.session) {
    return { 
      success: true,
      error: "Please check your email to confirm your account before signing in."
    };
  }

  if (data.user && data.session) {
    // User is signed in, create profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email: email,
      full_name: fullName,
      role: role,
      school_code: schoolCode,
      onboarding_completed: false,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    revalidatePath("/", "layout");
    
    const dashboardPath = role === "teacher" ? "/teacher" : "/student";
    redirect(dashboardPath);
  }

  return { error: "Something went wrong. Please try again." };
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/", "layout");

  const role = profile?.role || "student";
  const dashboardPath = role === "teacher" ? "/teacher" : "/student";
  redirect(dashboardPath);
}

export async function signInWithGoogle(role: "teacher" | "student") {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?role=${role}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function deleteAccount(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Delete user data from all related tables (cascading will handle most)
  // The profile deletion will cascade to related data via foreign keys
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile deletion error:", profileError);
    return { error: "Failed to delete account data" };
  }

  // Sign out the user
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}

export async function switchRole(newRole: "teacher" | "student"): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to switch role" };
  }

  revalidatePath("/", "layout");
  
  const dashboardPath = newRole === "teacher" ? "/teacher" : "/student";
  redirect(dashboardPath);
}
