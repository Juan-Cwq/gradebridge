"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ChevronRight, Award } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createBrowserClient } from "@supabase/ssr";

type ClassGrade = {
  classId: string;
  className: string;
  classColor: string | null;
  teacherName: string | null;
  assignments: {
    id: string;
    name: string;
    pointsEarned: number | null;
    pointsPossible: number;
    percentage: number | null;
    letterGrade: string | null;
  }[];
  average: number | null;
  letterGrade: string | null;
};

export default function StudentGradesPage() {
  const [classGrades, setClassGrades] = useState<ClassGrade[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchGrades = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          class_id,
          class:classes(
            id,
            name,
            color,
            teacher:profiles(full_name)
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const grades: ClassGrade[] = [];

      for (const enrollment of enrollments) {
        const cls = enrollment.class as {
          id: string;
          name: string;
          color: string | null;
          teacher: { full_name: string | null } | null;
        } | null;

        if (!cls) continue;

        const { data: assignments } = await supabase
          .from("assignments")
          .select("id, name, points_possible")
          .eq("class_id", cls.id)
          .eq("is_published", true);

        const classGrade: ClassGrade = {
          classId: cls.id,
          className: cls.name,
          classColor: cls.color,
          teacherName: cls.teacher?.full_name || null,
          assignments: [],
          average: null,
          letterGrade: null,
        };

        if (assignments && assignments.length > 0) {
          let totalEarned = 0;
          let totalPossible = 0;

          for (const assignment of assignments) {
            classGrade.assignments.push({
              id: assignment.id,
              name: assignment.name,
              pointsEarned: null,
              pointsPossible: assignment.points_possible,
              percentage: null,
              letterGrade: null,
            });
            totalPossible += assignment.points_possible;
          }

          if (totalPossible > 0 && totalEarned > 0) {
            classGrade.average = (totalEarned / totalPossible) * 100;
            classGrade.letterGrade = getLetterGrade(classGrade.average);
          }
        }

        grades.push(classGrade);
      }

      setClassGrades(grades);
      setLoading(false);
    };

    fetchGrades();
  }, [supabase]);

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "bg-base-300 text-base-content/50";
    switch (grade) {
      case "A": return "bg-success/20 text-success";
      case "B": return "bg-info/20 text-info";
      case "C": return "bg-warning/20 text-warning";
      case "D": return "bg-orange-500/20 text-orange-600";
      case "F": return "bg-error/20 text-error";
      default: return "bg-base-300 text-base-content/50";
    }
  };

  const classColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-secondary"></div>
      </div>
    );
  }

  const selectedClassData = classGrades.find((c) => c.classId === selectedClass);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-base-content">My Grades</h1>
        <p className="text-base-content/60">View your grades for all enrolled classes</p>
      </div>

      {classGrades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No grades yet</h3>
            <p className="text-sm text-base-content/60">
              Join a class to see your grades
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-base-content">Classes</h2>
            {classGrades.map((classGrade, index) => (
              <motion.button
                key={classGrade.classId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedClass(classGrade.classId)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedClass === classGrade.classId
                    ? "border-secondary bg-secondary/5"
                    : "border-base-300 hover:border-base-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      classGrade.classColor
                        ? `bg-[${classGrade.classColor}]`
                        : classColors[index % classColors.length]
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base-content truncate">
                      {classGrade.className}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {classGrade.teacherName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(classGrade.letterGrade)}`}>
                      {classGrade.letterGrade || "--"}
                    </span>
                    <span className="text-sm text-base-content/60">
                      {classGrade.average !== null ? `${classGrade.average.toFixed(1)}%` : "--"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-base-content/40" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedClassData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{selectedClassData.className}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-lg font-bold ${getGradeColor(selectedClassData.letterGrade)}`}>
                        {selectedClassData.letterGrade || "--"}
                      </span>
                      <span className="text-lg text-base-content/60">
                        {selectedClassData.average !== null ? `${selectedClassData.average.toFixed(1)}%` : "--"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedClassData.assignments.length === 0 ? (
                    <p className="text-center text-base-content/50 py-8">
                      No assignments yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-4 px-3 py-2 text-xs font-medium text-base-content/50 uppercase">
                        <span className="col-span-2">Assignment</span>
                        <span className="text-right">Score</span>
                        <span className="text-right">Grade</span>
                      </div>
                      {selectedClassData.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="grid grid-cols-4 gap-4 px-3 py-3 rounded-lg hover:bg-base-200 transition-colors"
                        >
                          <span className="col-span-2 font-medium text-base-content truncate">
                            {assignment.name}
                          </span>
                          <span className="text-right text-base-content/70">
                            {assignment.pointsEarned !== null
                              ? `${assignment.pointsEarned}/${assignment.pointsPossible}`
                              : `--/${assignment.pointsPossible}`}
                          </span>
                          <span className="text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getGradeColor(assignment.letterGrade)}`}>
                              {assignment.letterGrade || "--"}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                  <p className="text-base-content/50">
                    Select a class to view detailed grades
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
