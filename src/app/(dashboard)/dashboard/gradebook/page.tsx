"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronDown,
  Save,
  FileText,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  name: string;
  category: string;
  points_possible: number;
  due_date: string;
}

interface Student {
  id: string;
  name: string;
}

interface Grade {
  assignmentId: string;
  studentId: string;
  points_earned: number | null;
  status: "graded" | "missing" | "excused" | "not_submitted";
}

const mockClasses = [
  { id: "1", name: "6th Grade Language Arts", color: "#6366F1" },
  { id: "2", name: "6th Grade Social Studies", color: "#3B82F6" },
  { id: "3", name: "Creative Writing Elective", color: "#10B981" },
];

const mockAssignments: Assignment[] = [
  { id: "a1", name: "Essay Draft", category: "assignment", points_possible: 100, due_date: "2026-05-01" },
  { id: "a2", name: "Vocab Quiz 1", category: "quiz", points_possible: 20, due_date: "2026-04-28" },
  { id: "a3", name: "Reading Response", category: "homework", points_possible: 50, due_date: "2026-04-25" },
  { id: "a4", name: "Grammar Test", category: "test", points_possible: 100, due_date: "2026-04-20" },
  { id: "a5", name: "Class Participation", category: "participation", points_possible: 10, due_date: "2026-04-15" },
];

const mockStudents: Student[] = [
  { id: "s1", name: "Emma Thompson" },
  { id: "s2", name: "Liam Martinez" },
  { id: "s3", name: "Olivia Johnson" },
  { id: "s4", name: "Noah Williams" },
  { id: "s5", name: "Ava Brown" },
  { id: "s6", name: "Ethan Davis" },
  { id: "s7", name: "Sophia Miller" },
  { id: "s8", name: "Mason Wilson" },
];

const initialGrades: Grade[] = [
  { assignmentId: "a1", studentId: "s1", points_earned: 92, status: "graded" },
  { assignmentId: "a1", studentId: "s2", points_earned: 85, status: "graded" },
  { assignmentId: "a1", studentId: "s3", points_earned: 78, status: "graded" },
  { assignmentId: "a1", studentId: "s4", points_earned: null, status: "missing" },
  { assignmentId: "a1", studentId: "s5", points_earned: 95, status: "graded" },
  { assignmentId: "a2", studentId: "s1", points_earned: 18, status: "graded" },
  { assignmentId: "a2", studentId: "s2", points_earned: 20, status: "graded" },
  { assignmentId: "a2", studentId: "s3", points_earned: 16, status: "graded" },
  { assignmentId: "a2", studentId: "s4", points_earned: 14, status: "graded" },
  { assignmentId: "a2", studentId: "s5", points_earned: null, status: "excused" },
  { assignmentId: "a3", studentId: "s1", points_earned: 45, status: "graded" },
  { assignmentId: "a3", studentId: "s2", points_earned: 50, status: "graded" },
  { assignmentId: "a4", studentId: "s1", points_earned: 88, status: "graded" },
  { assignmentId: "a4", studentId: "s2", points_earned: 92, status: "graded" },
  { assignmentId: "a4", studentId: "s3", points_earned: 76, status: "graded" },
];

const categoryColors: Record<string, string> = {
  assignment: "#6366F1",
  quiz: "#F59E0B",
  test: "#EF4444",
  homework: "#3B82F6",
  participation: "#10B981",
  project: "#8B5CF6",
  extra_credit: "#EC4899",
};

function getLetterGrade(percentage: number): string {
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return "text-success";
  if (percentage >= 80) return "text-info";
  if (percentage >= 70) return "text-warning";
  return "text-error";
}

export default function GradebookPage() {
  const [selectedClass, setSelectedClass] = useState(mockClasses[0]);
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [editingCell, setEditingCell] = useState<{ assignmentId: string; studentId: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const getGrade = (assignmentId: string, studentId: string) => {
    return grades.find(
      (g) => g.assignmentId === assignmentId && g.studentId === studentId
    );
  };

  const calculateStudentAverage = (studentId: string) => {
    let totalPoints = 0;
    let earnedPoints = 0;

    mockAssignments.forEach((assignment) => {
      const grade = getGrade(assignment.id, studentId);
      if (grade && grade.status === "graded" && grade.points_earned !== null) {
        totalPoints += assignment.points_possible;
        earnedPoints += grade.points_earned;
      }
    });

    if (totalPoints === 0) return null;
    return (earnedPoints / totalPoints) * 100;
  };

  const handleGradeChange = (assignmentId: string, studentId: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    
    setGrades((prev) => {
      const existing = prev.find(
        (g) => g.assignmentId === assignmentId && g.studentId === studentId
      );
      
      if (existing) {
        return prev.map((g) =>
          g.assignmentId === assignmentId && g.studentId === studentId
            ? { ...g, points_earned: numValue, status: numValue !== null ? "graded" : "not_submitted" }
            : g
        );
      } else {
        return [
          ...prev,
          {
            assignmentId,
            studentId,
            points_earned: numValue,
            status: numValue !== null ? "graded" : "not_submitted",
          },
        ];
      }
    });
    
    setHasChanges(true);
    setEditingCell(null);
  };

  const handleSave = () => {
    setHasChanges(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-base-content">
            Gradebook
          </h1>
          <p className="text-base-content/60 mt-1">
            View and manage student grades
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button
                  variant="sync"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="outline"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddAssignment(true)}
          >
            Add Assignment
          </Button>
        </div>
      </div>

      {/* Class Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={selectedClass.id}
            onChange={(e) => {
              const cls = mockClasses.find((c) => c.id === e.target.value);
              if (cls) setSelectedClass(cls);
            }}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-base-300 bg-base-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {mockClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40 pointer-events-none" />
        </div>
        
        {/* Category Legend */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          {Object.entries(categoryColors).slice(0, 5).map(([category, color]) => (
            <div key={category} className="flex items-center gap-1.5 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-base-content/60 capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gradebook Table */}
      <Card variant="elevated" animate={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-base-200/50">
                <th className="sticky left-0 z-10 bg-base-200/50 text-left px-4 py-3 text-sm font-semibold text-base-content border-b border-r border-base-300 min-w-[200px]">
                  Student
                </th>
                {mockAssignments.map((assignment) => (
                  <th
                    key={assignment.id}
                    className="text-center px-2 py-3 text-sm font-medium text-base-content border-b border-base-300 min-w-[100px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: categoryColors[assignment.category] }}
                      />
                      <span className="truncate max-w-[90px]" title={assignment.name}>
                        {assignment.name}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {assignment.points_possible} pts
                      </span>
                    </div>
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-sm font-semibold text-base-content border-b border-l border-base-300 min-w-[100px] bg-base-200/50">
                  Average
                </th>
              </tr>
            </thead>
            <tbody>
              {mockStudents.map((student, idx) => {
                const average = calculateStudentAverage(student.id);
                return (
                  <tr
                    key={student.id}
                    className={cn(
                      "hover:bg-base-200/30 transition-colors",
                      idx % 2 === 0 ? "bg-base-100" : "bg-base-200/20"
                    )}
                  >
                    <td className="sticky left-0 z-10 px-4 py-3 font-medium text-base-content border-r border-base-300/50 bg-inherit">
                      {student.name}
                    </td>
                    {mockAssignments.map((assignment) => {
                      const grade = getGrade(assignment.id, student.id);
                      const isEditing =
                        editingCell?.assignmentId === assignment.id &&
                        editingCell?.studentId === student.id;
                      const percentage =
                        grade?.points_earned !== null && grade?.points_earned !== undefined
                          ? (grade.points_earned / assignment.points_possible) * 100
                          : null;

                      return (
                        <td
                          key={assignment.id}
                          className="text-center px-2 py-2 border-base-300/30"
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() =>
                                handleGradeChange(assignment.id, student.id, editValue)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleGradeChange(assignment.id, student.id, editValue);
                                } else if (e.key === "Escape") {
                                  setEditingCell(null);
                                }
                              }}
                              className="w-16 px-2 py-1 text-center rounded border border-primary bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                              max={assignment.points_possible}
                              min={0}
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCell({ assignmentId: assignment.id, studentId: student.id });
                                setEditValue(grade?.points_earned?.toString() || "");
                              }}
                              className={cn(
                                "w-16 py-1 rounded text-sm font-medium transition-colors",
                                grade?.status === "excused"
                                  ? "bg-base-300/50 text-base-content/50"
                                  : grade?.status === "missing"
                                  ? "bg-error/10 text-error"
                                  : percentage !== null
                                  ? cn("hover:bg-base-200", getGradeColor(percentage))
                                  : "text-base-content/30 hover:bg-base-200"
                              )}
                            >
                              {grade?.status === "excused"
                                ? "EX"
                                : grade?.status === "missing"
                                ? "M"
                                : grade?.points_earned !== null && grade?.points_earned !== undefined
                                ? grade.points_earned
                                : "—"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3 border-l border-base-300/50 bg-base-200/30">
                      {average !== null ? (
                        <div className="flex flex-col items-center">
                          <span className={cn("font-bold", getGradeColor(average))}>
                            {average.toFixed(1)}%
                          </span>
                          <span className={cn("text-xs", getGradeColor(average))}>
                            {getLetterGrade(average)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="text-error font-medium">M</span> = Missing
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base-content/50 font-medium">EX</span> = Excused
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base-content/30">—</span> = Not submitted
        </div>
      </div>

      {/* Add Assignment Modal */}
      <AnimatePresence>
        {showAddAssignment && (
          <AddAssignmentModal onClose={() => setShowAddAssignment(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddAssignmentModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "assignment",
    points_possible: 100,
    due_date: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <h2 className="text-xl font-semibold text-base-content">
            Add Assignment
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Assignment Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chapter 5 Quiz"
              className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="test">Test</option>
                <option value="homework">Homework</option>
                <option value="project">Project</option>
                <option value="participation">Participation</option>
                <option value="extra_credit">Extra Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Points Possible
              </label>
              <input
                type="number"
                value={formData.points_possible}
                onChange={(e) =>
                  setFormData({ ...formData, points_possible: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="sync" className="flex-1">
              Add Assignment
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
