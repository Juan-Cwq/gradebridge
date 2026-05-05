"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createBrowserClient } from "@supabase/ssr";

type Assignment = {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  points_possible: number;
  class: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAssignments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("class_id, class:classes(id, name)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = enrollments.map((e) => e.class_id);
      const uniqueClasses = enrollments
        .map((e) => e.class as { id: string; name: string } | null)
        .filter((c): c is { id: string; name: string } => c !== null);
      setClasses(uniqueClasses);

      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          id,
          name,
          description,
          due_date,
          points_possible,
          class:classes(id, name, color)
        `)
        .in("class_id", classIds)
        .eq("is_published", true)
        .order("due_date", { ascending: true });

      setAssignments(assignmentsData || []);
      setLoading(false);
    };

    fetchAssignments();
  }, [supabase]);

  const filteredAssignments = assignments.filter((a) => {
    const now = new Date();
    const dueDate = a.due_date ? new Date(a.due_date) : null;

    if (classFilter !== "all" && a.class?.id !== classFilter) return false;

    if (filter === "upcoming") {
      return dueDate && dueDate >= now;
    } else if (filter === "past") {
      return dueDate && dueDate < now;
    }
    return true;
  });

  const getUrgencyBadge = (dueDate: string | null) => {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-medium">Past due</span>;
    } else if (diffDays === 0) {
      return <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-medium">Due today</span>;
    } else if (diffDays <= 3) {
      return <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">Due in {diffDays} days</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-base-300 text-base-content/60 text-xs font-medium">Due in {diffDays} days</span>;
  };

  const classColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-base-content">Assignments</h1>
        <p className="text-base-content/60">View all your assignments across classes</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all" ? "bg-secondary text-secondary-content" : "bg-base-200 hover:bg-base-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "upcoming" ? "bg-secondary text-secondary-content" : "bg-base-200 hover:bg-base-300"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "past" ? "bg-secondary text-secondary-content" : "bg-base-200 hover:bg-base-300"
            }`}
          >
            Past
          </button>
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-base-300 bg-base-100"
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No assignments found</h3>
            <p className="text-sm text-base-content/60">
              {classes.length === 0
                ? "Join a class to see assignments"
                : "No assignments match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-12 rounded-full ${
                        assignment.class?.color
                          ? `bg-[${assignment.class.color}]`
                          : classColors[index % classColors.length]
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-base-content truncate">
                        {assignment.name}
                      </h3>
                      <p className="text-sm text-base-content/60">
                        {assignment.class?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-base-content">
                          {assignment.points_possible} pts
                        </p>
                        {assignment.due_date && (
                          <p className="text-xs text-base-content/50">
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {getUrgencyBadge(assignment.due_date)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
