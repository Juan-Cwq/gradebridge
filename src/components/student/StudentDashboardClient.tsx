"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  FileQuestion,
  BookMarked,
  Megaphone,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type DashboardStats = {
  enrolledClasses: number;
  dueThisWeek: number;
  overallAverage: number;
  aiTutorSessions: number;
};

type Assignment = {
  id: string;
  name: string;
  due_date: string | null;
  points_possible: number;
  className: string;
  classColor: string | null;
  classId: string;
  teacherName: string;
};

type ClassData = {
  id: string;
  name: string;
  color: string | null;
  period: string | null;
  subject: string | null;
  teacher: { full_name: string | null } | null;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean | null;
  class: { id: string; name: string; color: string | null } | null;
};

const statCards = [
  { key: "enrolledClasses", label: "Enrolled Classes", icon: BookOpen, color: "secondary" },
  { key: "dueThisWeek", label: "Due This Week", icon: Calendar, color: "warning" },
  { key: "overallAverage", label: "Overall Average", icon: TrendingUp, color: "success", suffix: "%" },
  { key: "aiTutorSessions", label: "AI Tutor Sessions", icon: Bot, color: "accent" },
];

const aiTutorTools = [
  { icon: Lightbulb, label: "Explain a concept", description: "Get clear explanations", href: "/student/ai-tutor?mode=explain" },
  { icon: FileQuestion, label: "Practice quiz", description: "Test your knowledge", href: "/student/ai-tutor?mode=quiz" },
  { icon: BookMarked, label: "Study help", description: "Get study tips", href: "/student/ai-tutor?mode=study" },
];

const classColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

export default function StudentDashboardClient({
  stats,
  classes,
  assignments,
  announcements,
}: {
  stats: DashboardStats;
  classes: ClassData[];
  assignments: Assignment[];
  announcements: Announcement[];
}) {
  const [activeTab, setActiveTab] = useState<"todo" | "submitted" | "all">("todo");

  const getClassColor = (color: string | null, index: number) => 
    color || classColors[index % classColors.length];

  const getUrgencyBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-medium">Due today</span>;
    } else if (diffDays <= 3) {
      return <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">Due in {diffDays} days</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-base-300 text-base-content/60 text-xs font-medium">Due in {diffDays} days</span>;
  };

  const upcomingAssignments = assignments
    .filter((a) => a.due_date && new Date(a.due_date) >= new Date())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

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
                      {stat.suffix || ""}
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
                  onClick={() => setActiveTab("todo")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "todo"
                      ? "bg-secondary text-secondary-content"
                      : "text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => setActiveTab("submitted")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "submitted"
                      ? "bg-secondary text-secondary-content"
                      : "text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  Submitted
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "all"
                      ? "bg-secondary text-secondary-content"
                      : "text-base-content/60 hover:bg-base-200"
                  }`}
                >
                  All Assignments
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {activeTab === "todo" && (
                <div className="space-y-3">
                  {upcomingAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-success/50 mb-3" />
                      <h3 className="font-semibold text-base-content mb-1">All caught up!</h3>
                      <p className="text-sm text-base-content/60">
                        No upcoming assignments due
                      </p>
                    </div>
                  ) : (
                    upcomingAssignments.slice(0, 8).map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <div
                          className={`w-2 h-10 rounded-full ${getClassColor(assignment.classColor, index)}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base-content truncate">
                            {assignment.name}
                          </p>
                          <p className="text-sm text-base-content/60">
                            {assignment.className} • {assignment.teacherName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-base-content/70">
                            {assignment.points_possible} pts
                          </span>
                          {getUrgencyBadge(assignment.due_date)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "submitted" && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                  <h3 className="font-semibold text-base-content mb-1">No submissions yet</h3>
                  <p className="text-sm text-base-content/60">
                    Your submitted assignments will appear here
                  </p>
                </div>
              )}

              {activeTab === "all" && (
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                      <h3 className="font-semibold text-base-content mb-1">No assignments</h3>
                      <p className="text-sm text-base-content/60">
                        Join a class to see assignments
                      </p>
                    </div>
                  ) : (
                    assignments.slice(0, 10).map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <div
                          className={`w-2 h-10 rounded-full ${getClassColor(assignment.classColor, index)}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base-content truncate">
                            {assignment.name}
                          </p>
                          <p className="text-sm text-base-content/60">{assignment.className}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-base-content/70">
                            {assignment.points_possible} pts
                          </p>
                          {assignment.due_date && (
                            <p className="text-xs text-base-content/50">
                              Due {new Date(assignment.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Recent Announcements
                </h3>
                <Link href="/student/inbox" className="text-sm text-secondary hover:underline">
                  View Inbox
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {announcements.length === 0 ? (
                <p className="text-center text-base-content/50 py-4 text-sm">
                  No announcements
                </p>
              ) : (
                <div className="space-y-2">
                  {announcements.slice(0, 3).map((announcement, index) => (
                    <Link
                      key={announcement.id}
                      href="/student/inbox"
                      className="block p-3 rounded-lg border border-base-300 hover:border-secondary hover:bg-secondary/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-10 rounded-full ${getClassColor(
                            announcement.class?.color || null,
                            index
                          )}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base-content text-sm truncate">{announcement.title}</p>
                          <p className="text-xs text-base-content/50">
                            {announcement.class?.name} • {new Date(announcement.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-base-content/30" />
                      </div>
                    </Link>
                  ))}
                  {announcements.length > 3 && (
                    <Link
                      href="/student/inbox"
                      className="block text-center text-sm text-secondary hover:underline py-2"
                    >
                      View {announcements.length - 3} more in Inbox
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  My Grades
                </h3>
                <Link href="/student/grades" className="text-sm text-secondary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {classes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-base-content/50">Join a class to see grades</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {classes.slice(0, 5).map((cls, index) => (
                    <Link
                      key={cls.id}
                      href={`/student/grades?class=${cls.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors group"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${getClassColor(cls.color, index)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-base-content truncate">
                          {cls.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-base-content">--</span>
                        <span className="px-1.5 py-0.5 rounded bg-base-300 text-xs text-base-content/70">
                          --
                        </span>
                        <ChevronRight className="w-4 h-4 text-base-content/40 group-hover:text-base-content/70" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4 text-secondary" />
                AI Tutor
              </h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {aiTutorTools.map((tool) => (
                  <Link
                    key={tool.label}
                    href={tool.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                      <tool.icon className="w-5 h-5 text-secondary" />
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

          {classes.length === 0 && (
            <Card className="bg-gradient-to-br from-secondary/10 to-accent/10 border-secondary/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <Plus className="w-10 h-10 mx-auto text-secondary mb-3" />
                  <h4 className="font-semibold text-base-content">Join Your First Class</h4>
                  <p className="text-sm text-base-content/70 mt-1 mb-4">
                    Enter a class code from your teacher to get started
                  </p>
                  <Link href="/student/join-class">
                    <Button variant="secondary" size="sm">
                      Join a Class
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
