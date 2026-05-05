"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Sparkles,
  Plus,
  ChevronRight,
  FileText,
  Brain,
  ListChecks,
  Wand2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type DashboardStats = {
  activeClasses: number;
  studentsEnrolled: number;
  pendingGrades: number;
  aiLessonsGenerated: number;
};

type ClassWithRelations = {
  id: string;
  name: string;
  color: string | null;
  period: string | null;
  subject: string | null;
  assignments: { id: string; name: string; due_date: string | null; is_published: boolean | null }[];
  enrollments: { id: string }[];
};

type Activity = {
  id: string;
  created_at: string;
  status: string | null;
  student: { first_name: string; last_name: string } | null;
  assignment: { name: string; class: { name: string } | null } | null;
};

const statCards = [
  { key: "activeClasses", label: "Active Classes", icon: BookOpen, color: "primary" },
  { key: "studentsEnrolled", label: "Students Enrolled", icon: Users, color: "secondary" },
  { key: "pendingGrades", label: "Pending Grades", icon: ClipboardCheck, color: "warning" },
  { key: "aiLessonsGenerated", label: "AI Lessons Generated", icon: Sparkles, color: "accent" },
];

const aiTools = [
  { icon: FileText, label: "Lesson Plan Generator", description: "Create engaging lesson plans", href: "/teacher/ai-tools?tool=lesson-plan" },
  { icon: Brain, label: "Quiz Builder", description: "Generate quizzes from any topic", href: "/teacher/ai-tools?tool=quiz" },
  { icon: ListChecks, label: "Differentiation Tool", description: "Adapt content for all learners", href: "/teacher/ai-tools?tool=differentiation" },
  { icon: Wand2, label: "Rubric Maker", description: "Create grading rubrics instantly", href: "/teacher/ai-tools?tool=rubric" },
];

const classColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

export default function TeacherDashboardClient({
  stats,
  classes,
  recentActivity,
}: {
  stats: DashboardStats;
  classes: ClassWithRelations[];
  recentActivity: Activity[];
}) {
  const [activeTab, setActiveTab] = useState<"classes" | "assignments" | "gradebook">("classes");

  const getClassColor = (index: number) => classColors[index % classColors.length];

  const allAssignments = classes.flatMap((cls, clsIndex) =>
    cls.assignments.map((assignment) => ({
      ...assignment,
      className: cls.name,
      classColor: getClassColor(clsIndex),
    }))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-base-content/60">{stat.label}</p>
                    <p className="text-3xl font-bold text-base-content mt-1">
                      {stats[stat.key as keyof DashboardStats]}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-base-300">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("classes")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "classes"
                      ? "bg-primary text-primary-content"
                      : "text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  My Classes
                </button>
                <button
                  onClick={() => setActiveTab("assignments")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "assignments"
                      ? "bg-primary text-primary-content"
                      : "text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setActiveTab("gradebook")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "gradebook"
                      ? "bg-primary text-primary-content"
                      : "text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  Gradebook
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {activeTab === "classes" && (
                <div className="space-y-3">
                  {classes.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                      <h3 className="font-semibold text-base-content mb-1">No classes yet</h3>
                      <p className="text-sm text-base-content/60 mb-4">
                        Create your first class to get started
                      </p>
                      <Link href="/teacher/classes/new">
                        <Button variant="primary" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Class
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {classes.map((cls, index) => {
                        const pendingAssignments = cls.assignments.filter(
                          (a) => a.is_published && a.due_date && new Date(a.due_date) < new Date()
                        ).length;
                        const studentCount = cls.enrollments.length;

                        return (
                          <Link
                            key={cls.id}
                            href={`/teacher/classes/${cls.id}`}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                          >
                            <div className={`w-3 h-3 rounded-full ${getClassColor(index)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-base-content truncate">
                                {cls.name}
                              </p>
                              <p className="text-sm text-base-content/60">
                                {cls.period && `Period ${cls.period} • `}
                                {studentCount} students
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {pendingAssignments > 0 && (
                                <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                                  {pendingAssignments} pending
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-base-content/40 group-hover:text-base-content/70 transition-colors" />
                            </div>
                          </Link>
                        );
                      })}
                      <Link
                        href="/teacher/classes/new"
                        className="flex items-center gap-4 p-3 rounded-lg border-2 border-dashed border-base-300 hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <Plus className="w-5 h-5 text-base-content/40" />
                        <span className="text-base-content/60">Add a class</span>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {activeTab === "assignments" && (
                <div className="space-y-3">
                  {allAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardCheck className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                      <h3 className="font-semibold text-base-content mb-1">No assignments yet</h3>
                      <p className="text-sm text-base-content/60">
                        Create assignments in your classes
                      </p>
                    </div>
                  ) : (
                    allAssignments.slice(0, 10).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <div className={`w-2 h-8 rounded-full ${assignment.classColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base-content truncate">
                            {assignment.name}
                          </p>
                          <p className="text-sm text-base-content/60">{assignment.className}</p>
                        </div>
                        <div className="text-right">
                          {assignment.due_date ? (
                            <p className="text-sm text-base-content/60">
                              Due {new Date(assignment.due_date).toLocaleDateString()}
                            </p>
                          ) : (
                            <span className="text-xs text-base-content/40">No due date</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "gradebook" && (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                  <h3 className="font-semibold text-base-content mb-1">Quick Gradebook Access</h3>
                  <p className="text-sm text-base-content/60 mb-4">
                    View and edit grades for all your classes
                  </p>
                  <Link href="/teacher/gradebook">
                    <Button variant="primary" size="sm">
                      Open Gradebook
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Activity
              </h3>
            </CardHeader>
            <CardContent className="p-4">
              {recentActivity.length === 0 ? (
                <p className="text-center text-base-content/50 py-4 text-sm">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-base-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-base-content">
                          <span className="font-medium">
                            {activity.student?.first_name} {activity.student?.last_name}
                          </span>{" "}
                          submitted{" "}
                          <span className="font-medium">{activity.assignment?.name}</span>
                        </p>
                        <p className="text-xs text-base-content/50">
                          {activity.assignment?.class?.name} •{" "}
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
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
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Tools
              </h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {aiTools.map((tool) => (
                  <Link
                    key={tool.label}
                    href={tool.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base-content text-sm">{tool.label}</p>
                      <p className="text-xs text-base-content/60">{tool.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-base-content">AI-Powered Insights</h4>
                  <p className="text-sm text-base-content/70 mt-1">
                    Get personalized recommendations for your teaching based on student performance.
                  </p>
                  <Link href="/teacher/ai-tools">
                    <Button variant="primary" size="sm" className="mt-3">
                      Explore AI Tools
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
