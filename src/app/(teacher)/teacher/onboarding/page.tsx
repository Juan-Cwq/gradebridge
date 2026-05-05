"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Users,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Palette,
  Copy,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

const classColors = [
  { name: "Blue", value: "#3B82F6", class: "bg-blue-500" },
  { name: "Green", value: "#22C55E", class: "bg-green-500" },
  { name: "Purple", value: "#A855F7", class: "bg-purple-500" },
  { name: "Orange", value: "#F97316", class: "bg-orange-500" },
  { name: "Pink", value: "#EC4899", class: "bg-pink-500" },
  { name: "Teal", value: "#14B8A6", class: "bg-teal-500" },
];

const gradingScales = [
  { name: "Standard (A-F)", id: "standard", description: "A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59" },
  { name: "Plus/Minus", id: "plus-minus", description: "A+, A, A-, B+, B, B-, etc." },
  { name: "Points Only", id: "points", description: "No letter grades, just point values" },
];

export default function TeacherOnboarding() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [classData, setClassData] = useState({
    name: "",
    subject: "",
    period: "",
    color: classColors[0].value,
  });
  const [gradingScale, setGradingScale] = useState("standard");
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleCreateClass = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("classes")
      .insert({
        name: classData.name,
        subject: classData.subject || null,
        period: classData.period || null,
        color: classData.color,
        teacher_id: user.id,
        school_year: new Date().getFullYear().toString(),
      })
      .select("join_code")
      .single();

    if (!error && data) {
      setJoinCode(data.join_code);
      setStep(3);
    }
  };

  const handleComplete = async () => {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
      }
      router.push("/teacher");
      router.refresh();
    });
  };

  const copyJoinCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-base-content">
            Welcome to GradeBridge!
          </h1>
          <p className="text-base-content/60 mt-2">
            Let&apos;s get you set up in just a few steps
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-base-300"
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
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base-content">Create Your First Class</h2>
                      <p className="text-sm text-base-content/60">Step 1 of 3</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-1">
                        Class Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={classData.name}
                        onChange={(e) => setClassData({ ...classData, name: e.target.value })}
                        placeholder="e.g., English Literature"
                        className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={classData.subject}
                          onChange={(e) => setClassData({ ...classData, subject: e.target.value })}
                          placeholder="e.g., English"
                          className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-base-content mb-1">
                          Period
                        </label>
                        <input
                          type="text"
                          value={classData.period}
                          onChange={(e) => setClassData({ ...classData, period: e.target.value })}
                          placeholder="e.g., 1"
                          className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">
                        <Palette className="inline w-4 h-4 mr-1" />
                        Class Color
                      </label>
                      <div className="flex gap-3">
                        {classColors.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setClassData({ ...classData, color: color.value })}
                            className={`w-10 h-10 rounded-lg ${color.class} transition-all ${
                              classData.color === color.value
                                ? "ring-2 ring-offset-2 ring-primary scale-110"
                                : "hover:scale-105"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    variant="primary"
                    className="w-full"
                    disabled={!classData.name.trim()}
                  >
                    Next: Set Grading Scale
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base-content">Set Grading Scale</h2>
                      <p className="text-sm text-base-content/60">Step 2 of 3</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {gradingScales.map((scale) => (
                      <button
                        key={scale.id}
                        onClick={() => setGradingScale(scale.id)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                          gradingScale === scale.id
                            ? "border-primary bg-primary/5"
                            : "border-base-300 hover:border-base-400"
                        }`}
                      >
                        <p className="font-medium text-base-content">{scale.name}</p>
                        <p className="text-sm text-base-content/60">{scale.description}</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleCreateClass}
                      variant="primary"
                      className="flex-1"
                      isLoading={isPending}
                    >
                      Create Class
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base-content">Invite Students</h2>
                      <p className="text-sm text-base-content/60">Step 3 of 3</p>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <p className="text-base-content mb-2">
                      <strong>{classData.name}</strong> has been created!
                    </p>
                    <p className="text-sm text-base-content/60">
                      Share this code with your students:
                    </p>
                  </div>

                  <div className="bg-base-200 rounded-xl p-6 text-center">
                    <p className="text-4xl font-mono font-bold tracking-widest text-primary mb-2">
                      {joinCode}
                    </p>
                    <Button variant="outline" size="sm" onClick={copyJoinCode}>
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1 text-success" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>

                  <Button
                    onClick={handleComplete}
                    variant="primary"
                    className="w-full"
                    isLoading={isPending}
                  >
                    Go to Dashboard
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
