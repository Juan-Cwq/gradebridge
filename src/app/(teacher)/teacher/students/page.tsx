"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  MessageSquare,
  MoreVertical,
  UserPlus,
  Download,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

type EnrolledStudent = {
  id: string;
  full_name: string | null;
  email: string | null;
  className: string;
  classId: string;
  enrolledAt: string;
};

type Class = {
  id: string;
  name: string;
};

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: "",
    last_name: "",
    email: "",
    grade_level: "",
    class_id: "",
  });
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch teacher's classes
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name")
      .eq("teacher_id", user.id)
      .eq("is_archived", false);

    setClasses(classesData || []);
    if (classesData && classesData.length > 0) {
      setNewStudent((prev) => ({ ...prev, class_id: classesData[0].id }));
    }

    // Fetch all enrollments with user profile data
    const classIds = (classesData || []).map((c) => c.id);
    if (classIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: enrollmentsData } = await supabase
      .from("enrollments")
      .select(`
        id,
        class_id,
        enrolled_at,
        user:profiles!enrollments_user_id_fkey(id, full_name, email),
        class:classes(name)
      `)
      .in("class_id", classIds)
      .eq("is_active", true)
      .not("user_id", "is", null);

    const enrolledStudents: EnrolledStudent[] = (enrollmentsData || [])
      .map((e) => {
        const user = e.user as { id: string; full_name: string | null; email: string | null } | null;
        const cls = e.class as { name: string } | null;
        if (!user) return null;
        return {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          className: cls?.name || "Unknown",
          classId: e.class_id,
          enrolledAt: e.enrolled_at,
        };
      })
      .filter((s): s is EnrolledStudent => s !== null);

    // Remove duplicates (same student in multiple classes shown once)
    const uniqueStudents = Array.from(
      new Map(enrolledStudents.map((s) => [s.id, s])).values()
    );

    setStudents(uniqueStudents);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const filteredStudents = students.filter((s) => {
    const name = s.full_name?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddStudent = async () => {
    if (!newStudent.first_name.trim() || !newStudent.last_name.trim() || !newStudent.class_id) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    // Add to legacy students table
    const { data: studentData, error } = await supabase
      .from("students")
      .insert({
        teacher_id: user.id,
        first_name: newStudent.first_name.trim(),
        last_name: newStudent.last_name.trim(),
        email: newStudent.email.trim() || null,
        grade_level: newStudent.grade_level.trim() || null,
      })
      .select()
      .single();

    if (!error && studentData) {
      // Enroll in class
      await supabase.from("enrollments").insert({
        class_id: newStudent.class_id,
        student_id: studentData.id,
      });

      setNewStudent({
        first_name: "",
        last_name: "",
        email: "",
        grade_level: "",
        class_id: classes[0]?.id || "",
      });
      setShowAddModal(false);
      fetchData();
    }

    setSaving(false);
  };

  const handleExport = () => {
    let csv = "Name,Email,Class,Enrolled Date\n";
    students.forEach((student) => {
      csv += `"${student.full_name || "Unknown"}","${student.email || ""}","${student.className}","${new Date(student.enrolledAt).toLocaleDateString()}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">Students</h1>
          <p className="text-base-content/60">Manage your student roster</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={students.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-base-100 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Student</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-base-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grade Level</label>
                <input
                  type="text"
                  value={newStudent.grade_level}
                  onChange={(e) => setNewStudent({ ...newStudent, grade_level: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                  placeholder="9th Grade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Enroll in Class *</label>
                <select
                  value={newStudent.class_id}
                  onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleAddStudent}
                  disabled={!newStudent.first_name.trim() || !newStudent.last_name.trim()}
                  isLoading={saving}
                >
                  Add Student
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">
              {searchQuery ? "No students found" : "No students yet"}
            </h3>
            <p className="text-sm text-base-content/60 mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Students can join using your class join codes, or add them manually"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-left px-4 py-3 text-sm font-medium text-base-content/50">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-base-content/50">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-base-content/50">Class</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-base-content/50">Enrolled</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-base-content/50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-base-200 hover:bg-base-100"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                            {student.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2) || "?"}
                          </div>
                          <span className="font-medium text-base-content">
                            {student.full_name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base-content/70">
                        {student.email || "--"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          {student.className}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base-content/70 text-sm">
                        {new Date(student.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                              <MoreVertical className="w-4 h-4" />
                            </label>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-lg w-40">
                              <li><a>View Profile</a></li>
                              <li><a>Edit</a></li>
                              <li><a className="text-error">Remove</a></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
