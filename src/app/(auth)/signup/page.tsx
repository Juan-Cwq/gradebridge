"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, GraduationCap, BookOpen, Building2, MailCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signUp, signInWithGoogle } from "@/lib/auth/actions";

const teacherBenefits = [
  "Create unlimited classes and assignments",
  "AI-powered lesson plans and quiz builder",
  "Real-time grade sync and analytics",
];

const studentBenefits = [
  "Track all your assignments in one place",
  "AI tutor for homework help",
  "See grades and feedback instantly",
];

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationNeeded, setEmailConfirmationNeeded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    schoolCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = new FormData();
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("fullName", formData.name);
    data.append("role", role!);
    if (formData.schoolCode) {
      data.append("schoolCode", formData.schoolCode);
    }

    startTransition(async () => {
      const result = await signUp(data);
      if (result?.success && result?.error?.includes("check your email")) {
        setEmailConfirmationNeeded(true);
      } else if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleGoogleSignUp = () => {
    startTransition(async () => {
      await signInWithGoogle(role!);
    });
  };

  const benefits = role === "teacher" ? teacherBenefits : studentBenefits;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display text-base-content mb-2">
          Create Your Account
        </h1>
        <p className="text-base-content/60">
          Join GradeBridge and transform your educational experience
        </p>
      </div>

      <Card variant="elevated" animate={false}>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {emailConfirmationNeeded ? (
              <motion.div
                key="email-confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <MailCheck className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-base-content mb-2">
                  Check Your Email
                </h2>
                <p className="text-base-content/70 mb-4">
                  We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-base-content/50 mb-6">
                  Click the link in the email to activate your account, then come back here to sign in.
                </p>
                <Link href="/login">
                  <Button variant="primary">
                    Go to Sign In
                  </Button>
                </Link>
              </motion.div>
            ) : !role ? (
              <motion.div
                key="role-select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-base-content/70 text-center mb-4">
                  I am a...
                </p>
                
                <button
                  onClick={() => setRole("teacher")}
                  className="w-full p-4 rounded-xl border-2 border-base-300 hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base-content">Teacher</p>
                    <p className="text-sm text-base-content/60">Manage classes, grades, and AI tools</p>
                  </div>
                </button>

                <button
                  onClick={() => setRole("student")}
                  className="w-full p-4 rounded-xl border-2 border-base-300 hover:border-secondary hover:bg-secondary/5 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <BookOpen className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base-content">Student</p>
                    <p className="text-sm text-base-content/60">Track assignments, grades, and AI tutor</p>
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  onClick={() => setRole(null)}
                  className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
                >
                  ← Change role
                </button>

                <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-base-200">
                  {role === "teacher" ? (
                    <GraduationCap className="w-5 h-5 text-primary" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-secondary" />
                  )}
                  <span className="text-sm font-medium capitalize">{role} Account</span>
                </div>

                <div className="mb-6 space-y-2">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-base-content/70">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                    {error}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-center mb-6"
                  onClick={handleGoogleSignUp}
                  isLoading={isPending}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-base-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-base-100 px-2 text-base-content/50">
                      or sign up with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder={role === "teacher" ? "Sarah Jenkins" : "Alex Smith"}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">
                      {role === "teacher" ? "School Email" : "Email"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder={role === "teacher" ? "sarah@school.edu" : "alex@email.com"}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {role === "teacher" && (
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-1">
                        School Code <span className="text-base-content/50">(optional)</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                        <input
                          type="text"
                          value={formData.schoolCode}
                          onChange={(e) =>
                            setFormData({ ...formData, schoolCode: e.target.value.toUpperCase() })
                          }
                          placeholder="ABC123"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
                          maxLength={10}
                        />
                      </div>
                      <p className="text-xs text-base-content/50 mt-1">
                        Enter your school&apos;s code if provided by your administrator
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-base-content/50 mt-1">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary mt-0.5"
                      required
                    />
                    <span className="text-sm text-base-content/70">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="sync"
                    className="w-full justify-center"
                    isLoading={isPending}
                  >
                    Create {role === "teacher" ? "Teacher" : "Student"} Account
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <p className="text-center mt-6 text-base-content/60">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
