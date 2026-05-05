"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, BookOpen, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

export default function JoinClassPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ className: string; teacherName: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const code = joinCode.toUpperCase().trim();

    if (code.length !== 6) {
      setError("Join code must be 6 characters");
      return;
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to join a class");
        return;
      }

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          teacher:profiles(full_name)
        `)
        .eq("join_code", code)
        .eq("is_archived", false)
        .single();

      if (classError || !classData) {
        setError("Invalid join code. Please check and try again.");
        return;
      }

      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("class_id", classData.id)
        .eq("user_id", user.id)
        .single();

      if (existingEnrollment) {
        setError("You are already enrolled in this class");
        return;
      }

      const { error: enrollError } = await supabase.from("enrollments").insert({
        class_id: classData.id,
        user_id: user.id,
        is_active: true,
      });

      if (enrollError) {
        setError("Failed to join class. Please try again.");
        return;
      }

      const teacherProfile = classData.teacher as { full_name: string | null } | null;
      setSuccess({
        className: classData.name,
        teacherName: teacherProfile?.full_name || "Unknown Teacher",
      });

      setTimeout(() => {
        router.push("/student");
        router.refresh();
      }, 2000);
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <Link
        href="/student"
        className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-base-content">
                Join a Class
              </h1>
              <p className="text-base-content/60 mt-2">
                Enter the 6-character code provided by your teacher
              </p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-base-content mb-2">
                  Successfully Joined!
                </h2>
                <p className="text-base-content/70">
                  You&apos;re now enrolled in <strong>{success.className}</strong> with{" "}
                  {success.teacherName}
                </p>
                <p className="text-sm text-base-content/50 mt-4">
                  Redirecting to dashboard...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleJoinClass} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full text-center text-2xl tracking-widest font-mono py-4 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent uppercase"
                    required
                  />
                  <p className="text-xs text-base-content/50 mt-2 text-center">
                    The code is case-insensitive
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full justify-center"
                  isLoading={isPending}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Join Class
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-base-300">
              <p className="text-sm text-base-content/60 text-center">
                Don&apos;t have a code? Ask your teacher for the class join code.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
