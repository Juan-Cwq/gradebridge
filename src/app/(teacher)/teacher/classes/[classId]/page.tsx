"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  Plus,
  Copy,
  Check,
  Settings,
  Trash2,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

type ClassData = {
  id: string;
  name: string;
  subject: string | null;
  period: string | null;
  room: string | null;
  color: string | null;
  join_code: string | null;
  description: string | null;
};

type EnrolledStudent = {
  id: string;
  full_name: string | null;
  email: string | null;
  enrolled_at: string;
};

type Assignment = {
  id: string;
  name: string;
  due_date: string | null;
  points_possible: number;
  is_published: boolean | null;
};

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    name: "",
    description: "",
    points_possible: 100,
    due_date: "",
  });
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchClassData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch class details
      const { data: classInfo, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .eq("teacher_id", user.id)
        .single();

      if (classError || !classInfo) {
        router.push("/teacher/classes");
        return;
      }

      setClassData(classInfo);

      // Fetch enrolled students (via user_id in enrollments -> profiles)
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select(`
          id,
          enrolled_at,
          user:profiles(id, full_name, email)
        `)
        .eq("class_id", classId)
        .eq("is_active", true)
        .not("user_id", "is", null);

      const enrolledStudents: EnrolledStudent[] = (enrollmentsData || [])
        .map((e) => {
          const user = e.user as { id: string; full_name: string | null; email: string | null } | null;
          if (!user) return null;
          return {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            enrolled_at: e.enrolled_at,
          };
        })
        .filter((s): s is EnrolledStudent => s !== null);

      setStudents(enrolledStudents);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("id, name, due_date, points_possible, is_published")
        .eq("class_id", classId)
        .order("due_date", { ascending: true });

      setAssignments(assignmentsData || []);
      setLoading(false);
    };

    fetchClassData();
  }, [classId, supabase, router]);

  const copyJoinCode = () => {
    if (classData?.join_code) {
      navigator.clipboard.writeText(classData.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.name.trim()) return;

    setSaving(true);
    const { error } = await supabase.from("assignments").insert({
      class_id: classId,
      name: newAssignment.name.trim(),
      description: newAssignment.description.trim() || null,
      points_possible: newAssignment.points_possible,
      due_date: newAssignment.due_date || null,
      is_published: true,
    });

    if (!error) {
      // Refetch assignments
      const { data } = await supabase
        .from("assignments")
        .select("id, name, due_date, points_possible, is_published")
        .eq("class_id", classId)
        .order("due_date", { ascending: true });

      setAssignments(data || []);
      setNewAssignment({ name: "", description: "", points_possible: 100, due_date: "" });
      setShowAddAssignment(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!classData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                classData.color ? `bg-[${classData.color}]` : "bg-blue-500"
              }`}
            />
            <h1 className="text-2xl font-display font-bold text-base-content">
              {classData.name}
            </h1>
          </div>
          <p className="text-base-content/60 mt-1">
            {classData.subject && `${classData.subject} • `}
            {classData.period && `Period ${classData.period} • `}
            {students.length} student{students.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-base-200 rounded-lg">
            <span className="text-sm text-base-content/70">Join Code:</span>
            <span className="font-mono font-bold text-primary">
              {classData.join_code}
            </span>
            <button
              onClick={copyJoinCode}
              className="p-1 hover:bg-base-300 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-base-content/50" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Assignments ({assignments.length})
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddAssignment(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Assignment
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {showAddAssignment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 p-4 border border-primary/20 rounded-lg bg-primary/5"
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newAssignment.name}
                      onChange={(e) =>
                        setNewAssignment({ ...newAssignment, name: e.target.value })
                      }
                      placeholder="Assignment name"
                      className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={newAssignment.points_possible}
                        onChange={(e) =>
                          setNewAssignment({
                            ...newAssignment,
                            points_possible: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Points"
                        className="px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                      />
                      <input
                        type="date"
                        value={newAssignment.due_date}
                        onChange={(e) =>
                          setNewAssignment({ ...newAssignment, due_date: e.target.value })
                        }
                        className="px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddAssignment(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddAssignment}
                        isLoading={saving}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                  <p className="text-base-content/50 text-sm">No assignments yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-base-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-base-content">
                          {assignment.name}
                        </p>
                        <p className="text-sm text-base-content/50">
                          {assignment.points_possible} points
                          {assignment.due_date &&
                            ` • Due ${new Date(assignment.due_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          assignment.is_published
                            ? "bg-success/10 text-success"
                            : "bg-base-300 text-base-content/50"
                        }`}
                      >
                        {assignment.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students ({students.length})
              </h2>
            </CardHeader>
            <CardContent className="p-4">
              {students.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                  <p className="text-base-content/50 text-sm mb-2">No students yet</p>
                  <p className="text-xs text-base-content/40">
                    Share the join code with students
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                        {student.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-base-content truncate">
                          {student.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-base-content/50 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </h2>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link href={`/teacher/gradebook?class=${classId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Open Gradebook
                </Button>
              </Link>
              <Link href={`/teacher/messages?class=${classId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Students
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
