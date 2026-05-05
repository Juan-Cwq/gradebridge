"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

export default function StudentOnboarding() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [classInfo, setClassInfo] = useState<{
    name: string;
    teacher: string;
    subject: string | null;
  } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLookupClass = async () => {
    setError(null);
    const code = joinCode.toUpperCase().trim();

    if (code.length !== 6) {
      setError("Join code must be 6 characters");
      return;
    }

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        subject,
        teacher:profiles(full_name)
      `)
      .eq("join_code", code)
      .eq("is_archived", false)
      .single();

    if (classError || !classData) {
      setError("Invalid join code. Please check and try again.");
      return;
    }

    const teacherProfile = classData.teacher as { full_name: string | null } | null;
    setClassInfo({
      name: classData.name,
      teacher: teacherProfile?.full_name || "Unknown Teacher",
      subject: classData.subject,
    });
    setStep(2);
  };

  const handleConfirmEnrollment = async () => {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const code = joinCode.toUpperCase().trim();

      const { data: classData } = await supabase
        .from("classes")
        .select("id")
        .eq("join_code", code)
        .single();

      if (!classData) {
        setError("Class not found");
        return;
      }

      const { error: existingError, data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("class_id", classData.id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        setError("You are already enrolled in this class");
        return;
      }

      const { error: enrollError } = await supabase.from("enrollments").insert({
        class_id: classData.id,
        user_id: user.id,
        is_active: true,
      });

      if (enrollError) {
        setError("Failed to enroll. Please try again.");
        return;
      }

      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      router.push("/student");
      router.refresh();
    });
  };

  const handleSkip = async () => {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
      }
      router.push("/student");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-base-content">
            Welcome to GradeBridge!
          </h1>
          <p className="text-base-content/60 mt-2">
            Let&apos;s get you connected to your class
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? "bg-secondary" : "bg-base-300"
              }`}
            />
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base-content">Enter Join Code</h2>
                      <p className="text-sm text-base-content/60">Step 1 of 2</p>
                    </div>
                  </div>

                  <p className="text-base-content/70 text-sm">
                    Ask your teacher for the class join code, then enter it below to connect.
                  </p>

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
                      className="w-full text-center text-2xl tracking-widest font-mono py-4 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-secondary uppercase"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSkip}
                      variant="outline"
                      className="flex-1"
                      isLoading={isPending}
                    >
                      Skip for now
                    </Button>
                    <Button
                      onClick={handleLookupClass}
                      variant="secondary"
                      className="flex-1"
                      disabled={joinCode.length !== 6}
                    >
                      Find Class
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && classInfo && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base-content">Confirm Enrollment</h2>
                      <p className="text-sm text-base-content/60">Step 2 of 2</p>
                    </div>
                  </div>

                  <div className="bg-base-200 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-6 h-6 text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold text-base-content mb-2">
                      {classInfo.name}
                    </h3>
                    <p className="text-base-content/60">
                      {classInfo.subject && `${classInfo.subject} • `}
                      {classInfo.teacher}
                    </p>
                  </div>

                  <p className="text-center text-sm text-base-content/60">
                    Is this the correct class? Click confirm to join.
                  </p>

                  {error && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-error">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setStep(1);
                        setClassInfo(null);
                        setError(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleConfirmEnrollment}
                      variant="secondary"
                      className="flex-1"
                      isLoading={isPending}
                    >
                      Confirm & Join
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
