"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Palette,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
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
  { name: "Red", value: "#EF4444", class: "bg-red-500" },
  { name: "Yellow", value: "#EAB308", class: "bg-yellow-500" },
];

const periods = ["1", "2", "3", "4", "5", "6", "7", "8", "A", "B", "C", "D"];

export default function NewClassPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; joinCode: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    period: "",
    room: "",
    description: "",
    gradeLevel: "",
    color: classColors[0].value,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Class name is required");
      return;
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to create a class");
        return;
      }

      const { data, error: createError } = await supabase
        .from("classes")
        .insert({
          name: formData.name.trim(),
          subject: formData.subject.trim() || null,
          period: formData.period || null,
          room: formData.room.trim() || null,
          description: formData.description.trim() || null,
          grade_level: formData.gradeLevel.trim() || null,
          color: formData.color,
          teacher_id: user.id,
          school_year: new Date().getFullYear().toString(),
        })
        .select("name, join_code")
        .single();

      if (createError) {
        setError("Failed to create class. Please try again.");
        return;
      }

      setSuccess({
        name: data.name,
        joinCode: data.join_code!,
      });
    });
  };

  const copyJoinCode = () => {
    if (success?.joinCode) {
      navigator.clipboard.writeText(success.joinCode);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/teacher/classes"
        className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Classes
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {success ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-display font-bold text-base-content mb-2">
                Class Created!
              </h1>
              <p className="text-base-content/60 mb-6">
                <strong>{success.name}</strong> has been created successfully.
              </p>

              <div className="bg-base-200 rounded-xl p-6 mb-6">
                <p className="text-sm text-base-content/60 mb-2">
                  Share this code with your students
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl font-mono font-bold tracking-widest text-primary">
                    {success.joinCode}
                  </span>
                  <Button variant="outline" size="sm" onClick={copyJoinCode}>
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href="/teacher/classes">
                  <Button variant="outline">View All Classes</Button>
                </Link>
                <Link href={`/teacher/classes`}>
                  <Button variant="primary">Go to Class</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-display font-bold text-base-content">
                  Create a New Class
                </h1>
                <p className="text-base-content/60 mt-1">
                  Set up your class and get a join code for students
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">
                    Class Name <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., English Literature 101"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="e.g., English"
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">
                      Grade Level
                    </label>
                    <input
                      type="text"
                      value={formData.gradeLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, gradeLevel: e.target.value })
                      }
                      placeholder="e.g., 6th Grade"
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Period
                    </label>
                    <select
                      value={formData.period}
                      onChange={(e) =>
                        setFormData({ ...formData, period: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select period</option>
                      {periods.map((p) => (
                        <option key={p} value={p}>
                          Period {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">
                      Room
                    </label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                      placeholder="e.g., Room 204"
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">
                    <Palette className="inline w-4 h-4 mr-1" />
                    Class Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {classColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, color: color.value })
                        }
                        className={`w-10 h-10 rounded-lg ${color.class} transition-all ${
                          formData.color === color.value
                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                            : "hover:scale-105"
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the class..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Link href="/teacher/classes" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isLoading={isPending}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Class
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
