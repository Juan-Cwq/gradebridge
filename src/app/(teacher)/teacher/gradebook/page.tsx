"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Save,
  Download,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

type Class = {
  id: string;
  name: string;
  color: string | null;
};

type Student = {
  id: string;
  full_name: string;
};

type Assignment = {
  id: string;
  name: string;
  points_possible: number;
  due_date: string | null;
};

export default function TeacherGradebookPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Map<string, number | null>>(new Map());
  const [originalGrades, setOriginalGrades] = useState<Map<string, number | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchClasses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("classes")
        .select("id, name, color")
        .eq("teacher_id", user.id)
        .eq("is_archived", false)
        .order("name");

      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
      setLoading(false);
    };

    fetchClasses();
  }, [supabase]);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchGradebookData = async () => {
      // Fetch students enrolled via user_id (students who joined with join code)
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select(`
          user_id,
          user:profiles!enrollments_user_id_fkey(id, full_name)
        `)
        .eq("class_id", selectedClass)
        .eq("is_active", true)
        .not("user_id", "is", null);

      const studentsList: Student[] = (enrollmentsData || [])
        .map((e) => {
          const user = e.user as { id: string; full_name: string | null } | null;
          if (!user) return null;
          return {
            id: user.id,
            full_name: user.full_name || "Unknown Student",
          };
        })
        .filter((s): s is Student => s !== null);

      setStudents(studentsList);

      // Fetch assignments for this class
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("id, name, points_possible, due_date")
        .eq("class_id", selectedClass)
        .eq("is_published", true)
        .order("due_date", { ascending: true });

      setAssignments(assignmentsData || []);

      // Fetch grades (using user_id as student_id for profile-based students)
      if (studentsList.length > 0 && assignmentsData && assignmentsData.length > 0) {
        const { data: gradesData } = await supabase
          .from("grades")
          .select("student_id, assignment_id, points_earned")
          .in("student_id", studentsList.map((s) => s.id))
          .in("assignment_id", assignmentsData.map((a) => a.id));

        const gradesMap = new Map<string, number | null>();
        gradesData?.forEach((g) => {
          gradesMap.set(`${g.student_id}-${g.assignment_id}`, g.points_earned);
        });
        setGrades(gradesMap);
        setOriginalGrades(new Map(gradesMap));
      } else {
        setGrades(new Map());
        setOriginalGrades(new Map());
      }
    };

    fetchGradebookData();
  }, [selectedClass, supabase]);

  const handleGradeChange = (studentId: string, assignmentId: string, value: string) => {
    const key = `${studentId}-${assignmentId}`;
    const numValue = value === "" ? null : parseFloat(value);
    setGrades(new Map(grades.set(key, numValue)));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    const updates: { student_id: string; assignment_id: string; points_earned: number | null }[] = [];

    grades.forEach((value, key) => {
      const [studentId, assignmentId] = key.split("-");
      const originalValue = originalGrades.get(key);
      
      if (value !== originalValue) {
        updates.push({
          student_id: studentId,
          assignment_id: assignmentId,
          points_earned: value,
        });
      }
    });

    for (const update of updates) {
      // Check if grade exists
      const { data: existing } = await supabase
        .from("grades")
        .select("id")
        .eq("student_id", update.student_id)
        .eq("assignment_id", update.assignment_id)
        .single();

      if (existing) {
        await supabase
          .from("grades")
          .update({ 
            points_earned: update.points_earned,
            graded_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("grades").insert({
          student_id: update.student_id,
          assignment_id: update.assignment_id,
          points_earned: update.points_earned,
          graded_at: new Date().toISOString(),
        });
      }
    }

    setOriginalGrades(new Map(grades));
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExport = () => {
    const className = classes.find((c) => c.id === selectedClass)?.name || "gradebook";
    let csv = "Student," + assignments.map((a) => `"${a.name} (${a.points_possible} pts)"`).join(",") + ",Average,Grade\n";

    students.forEach((student) => {
      const row = [student.full_name];
      let totalEarned = 0;
      let totalPossible = 0;

      assignments.forEach((assignment) => {
        const grade = grades.get(`${student.id}-${assignment.id}`);
        row.push(grade !== null && grade !== undefined ? grade.toString() : "");
        if (grade !== null && grade !== undefined) {
          totalEarned += grade;
          totalPossible += assignment.points_possible;
        }
      });

      const average = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : "";
      const letterGrade = totalPossible > 0 ? getLetterGrade((totalEarned / totalPossible) * 100) : "";
      row.push(average ? `${average}%` : "");
      row.push(letterGrade);

      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${className.replace(/\s+/g, "_")}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateStudentAverage = (studentId: string): number | null => {
    let totalEarned = 0;
    let totalPossible = 0;

    assignments.forEach((assignment) => {
      const grade = grades.get(`${studentId}-${assignment.id}`);
      if (grade !== null && grade !== undefined) {
        totalEarned += grade;
        totalPossible += assignment.points_possible;
      }
    });

    if (totalPossible === 0) return null;
    return (totalEarned / totalPossible) * 100;
  };

  const getLetterGrade = (percentage: number | null): string => {
    if (percentage === null) return "--";
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-success";
      case "B": return "text-info";
      case "C": return "text-warning";
      case "D": return "text-orange-500";
      case "F": return "text-error";
      default: return "text-base-content/50";
    }
  };

  const hasChanges = () => {
    for (const [key, value] of grades) {
      if (originalGrades.get(key) !== value) return true;
    }
    return false;
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
          <h1 className="text-2xl font-display font-bold text-base-content">Gradebook</h1>
          <p className="text-base-content/60">View and edit student grades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={students.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveChanges}
            disabled={!hasChanges() || saving}
            isLoading={saving}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No classes yet</h3>
            <p className="text-sm text-base-content/60">
              Create a class to start using the gradebook
            </p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No students enrolled</h3>
            <p className="text-sm text-base-content/60">
              Share the class join code with students to enroll them
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignments.length === 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-base-content">No assignments yet</p>
                    <p className="text-sm text-base-content/60">
                      Create assignments from the class page to start entering grades
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b border-base-300">
              <h2 className="font-semibold">Class Roster ({students.length} student{students.length !== 1 ? "s" : ""})</h2>
            </CardHeader>
            <CardContent className="p-0">
              {assignments.length === 0 ? (
                <div className="divide-y divide-base-200">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 px-4 py-3 hover:bg-base-100">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                        {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium text-base-content">{student.full_name}</span>
                      <span className="ml-auto text-sm text-base-content/50">No grades yet</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-base-300 bg-base-200">
                        <th className="text-left px-4 py-3 text-sm font-medium text-base-content sticky left-0 bg-base-200 z-10">
                          Student
                        </th>
                        {assignments.map((assignment) => (
                          <th
                            key={assignment.id}
                            className="text-center px-2 py-3 text-sm font-medium text-base-content min-w-[80px]"
                          >
                            <div className="truncate max-w-[100px]" title={assignment.name}>
                              {assignment.name}
                            </div>
                            <div className="text-xs text-base-content/50 font-normal">
                              {assignment.points_possible} pts
                            </div>
                          </th>
                        ))}
                        <th className="text-center px-4 py-3 text-sm font-medium text-base-content">
                          Average
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-base-content">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const average = calculateStudentAverage(student.id);
                        const letterGrade = getLetterGrade(average);

                        return (
                          <tr
                            key={student.id}
                            className="border-b border-base-200 hover:bg-base-100"
                          >
                            <td className="px-4 py-2 sticky left-0 bg-base-100 z-10">
                              <span className="font-medium text-base-content">
                                {student.full_name}
                              </span>
                            </td>
                            {assignments.map((assignment) => {
                              const gradeKey = `${student.id}-${assignment.id}`;
                              const gradeValue = grades.get(gradeKey);

                              return (
                                <td key={assignment.id} className="px-2 py-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={assignment.points_possible}
                                    value={gradeValue ?? ""}
                                    onChange={(e) =>
                                      handleGradeChange(student.id, assignment.id, e.target.value)
                                    }
                                    className="w-16 px-2 py-1 text-center rounded border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="--"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-4 py-2 text-center font-medium">
                              {average !== null ? `${average.toFixed(1)}%` : "--"}
                            </td>
                            <td className={`px-4 py-2 text-center font-bold ${getGradeColor(letterGrade)}`}>
                              {letterGrade}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
