"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  FileText,
  Settings,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Tab = "roster" | "assignments" | "settings";

interface Student {
  id: string;
  name: string;
  email: string;
  average: number | null;
  assignmentsCompleted: number;
  totalAssignments: number;
}

interface Assignment {
  id: string;
  name: string;
  category: string;
  points_possible: number;
  due_date: string;
  status: "draft" | "published";
  submissions: number;
  totalStudents: number;
}

const mockClass = {
  id: "1",
  name: "6th Grade Language Arts",
  subject: "Language Arts",
  grade_level: "6th Grade",
  period: "1st Period",
  room: "Room 204",
  school_year: "2025-2026",
  color: "#6366F1",
  description: "Introduction to literary analysis, creative writing, and grammar fundamentals.",
};

const mockStudents: Student[] = [
  { id: "s1", name: "Emma Thompson", email: "emma.t@student.edu", average: 92, assignmentsCompleted: 11, totalAssignments: 12 },
  { id: "s2", name: "Liam Martinez", email: "liam.m@student.edu", average: 88, assignmentsCompleted: 12, totalAssignments: 12 },
  { id: "s3", name: "Olivia Johnson", email: "olivia.j@student.edu", average: 76, assignmentsCompleted: 10, totalAssignments: 12 },
  { id: "s4", name: "Noah Williams", email: "noah.w@student.edu", average: 65, assignmentsCompleted: 8, totalAssignments: 12 },
  { id: "s5", name: "Ava Brown", email: "ava.b@student.edu", average: 95, assignmentsCompleted: 12, totalAssignments: 12 },
  { id: "s6", name: "Ethan Davis", email: "ethan.d@student.edu", average: 82, assignmentsCompleted: 11, totalAssignments: 12 },
];

const mockAssignments: Assignment[] = [
  { id: "a1", name: "Historical Fiction Essay", category: "assignment", points_possible: 100, due_date: "2026-05-01", status: "published", submissions: 24, totalStudents: 28 },
  { id: "a2", name: "Vocabulary Quiz - Week 9", category: "quiz", points_possible: 20, due_date: "2026-04-28", status: "published", submissions: 28, totalStudents: 28 },
  { id: "a3", name: "Poetry Analysis", category: "assignment", points_possible: 50, due_date: "2026-04-25", status: "published", submissions: 26, totalStudents: 28 },
  { id: "a4", name: "Grammar Review Test", category: "test", points_possible: 100, due_date: "2026-04-20", status: "published", submissions: 28, totalStudents: 28 },
  { id: "a5", name: "Creative Writing Project", category: "project", points_possible: 150, due_date: "2026-05-15", status: "draft", submissions: 0, totalStudents: 28 },
];

const categoryColors: Record<string, string> = {
  assignment: "#6366F1",
  quiz: "#F59E0B",
  test: "#EF4444",
  homework: "#3B82F6",
  participation: "#10B981",
  project: "#8B5CF6",
};

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return "text-success";
  if (percentage >= 80) return "text-info";
  if (percentage >= 70) return "text-warning";
  return "text-error";
}

export default function ClassDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "roster", label: "Roster", icon: Users },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const filteredStudents = mockStudents.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/classes"
          className="p-2 rounded-lg hover:bg-base-200 transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: mockClass.color }}
            />
            <h1 className="text-2xl sm:text-3xl font-display text-base-content">
              {mockClass.name}
            </h1>
          </div>
          <p className="text-base-content/60">
            {mockClass.period} • {mockClass.room} • {mockClass.school_year}
          </p>
        </div>
        <Link href={`/dashboard/gradebook?class=${params.id}`}>
          <Button variant="sync">Open Gradebook</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-innovation/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-innovation" />
            </div>
            <div>
              <div className="text-2xl font-bold text-base-content">{mockStudents.length}</div>
              <div className="text-sm text-base-content/60">Students</div>
            </div>
          </div>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-trust/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-trust" />
            </div>
            <div>
              <div className="text-2xl font-bold text-base-content">{mockAssignments.length}</div>
              <div className="text-sm text-base-content/60">Assignments</div>
            </div>
          </div>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">87%</div>
              <div className="text-sm text-base-content/60">Class Average</div>
            </div>
          </div>
        </div>
        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold text-base-content">2</div>
              <div className="text-sm text-base-content/60">Due This Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-base-200 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/60 hover:text-base-content"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "roster" && (
          <motion.div
            key="roster"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <Button
                variant="outline"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => setShowAddStudent(true)}
              >
                Add Student
              </Button>
            </div>

            <Card variant="elevated" animate={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-base-300">
                      <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">Student</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">Average</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">Progress</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-base-content/60">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-base-300/50 hover:bg-base-200/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center text-white font-medium">
                              {student.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="font-medium text-base-content">{student.name}</div>
                              <div className="text-sm text-base-content/60">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {student.average !== null ? (
                            <span className={cn("font-semibold", getGradeColor(student.average))}>
                              {student.average}%
                            </span>
                          ) : (
                            <span className="text-base-content/40">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-base-300 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-success rounded-full"
                                style={{
                                  width: `${(student.assignmentsCompleted / student.totalAssignments) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-base-content/60">
                              {student.assignmentsCompleted}/{student.totalAssignments}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-lg hover:bg-base-200">
                            <MoreVertical className="w-4 h-4 text-base-content/60" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "assignments" && (
          <motion.div
            key="assignments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />}>
                Create Assignment
              </Button>
            </div>

            <div className="grid gap-4">
              {mockAssignments.map((assignment) => (
                <Card key={assignment.id} variant="elevated" animate={false} className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${categoryColors[assignment.category]}20` }}
                    >
                      <FileText
                        className="w-6 h-6"
                        style={{ color: categoryColors[assignment.category] }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base-content">{assignment.name}</h3>
                        {assignment.status === "draft" && (
                          <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-base-content/60 mt-1">
                        <span className="capitalize">{assignment.category}</span>
                        <span>{assignment.points_possible} points</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-base-content">
                        {assignment.submissions}/{assignment.totalStudents}
                      </div>
                      <div className="text-xs text-base-content/60">Submitted</div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-base-200">
                      <MoreVertical className="w-4 h-4 text-base-content/60" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card variant="elevated" animate={false}>
              <CardHeader>
                <h2 className="text-lg font-semibold">Class Settings</h2>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">Class Name</label>
                    <input
                      type="text"
                      defaultValue={mockClass.name}
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">Subject</label>
                    <input
                      type="text"
                      defaultValue={mockClass.subject}
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">Period</label>
                    <input
                      type="text"
                      defaultValue={mockClass.period}
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-1">Room</label>
                    <input
                      type="text"
                      defaultValue={mockClass.room}
                      className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-1">Description</label>
                  <textarea
                    defaultValue={mockClass.description}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="primary">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowAddStudent(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-base-100 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-base-300">
                <h2 className="text-xl font-semibold">Add Students to Class</h2>
                <button
                  onClick={() => setShowAddStudent(false)}
                  className="p-2 rounded-lg hover:bg-base-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-base-content/60 mb-4">
                  Select students from your roster to add to this class.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {["Alex Rivera", "Mia Chen", "James Kim"].map((name) => (
                    <label
                      key={name}
                      className="flex items-center gap-3 p-3 rounded-lg border border-base-300 cursor-pointer hover:bg-base-200/50"
                    >
                      <input type="checkbox" className="checkbox checkbox-primary" />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center text-white text-sm font-medium">
                        {name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-base-content">{name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowAddStudent(false)}>
                    Cancel
                  </Button>
                  <Button variant="sync" className="flex-1">
                    Add Selected
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
