"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Users,
  ClipboardList,
  MoreVertical,
  Copy,
  Settings,
  Archive,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ClassWithRelations = {
  id: string;
  name: string;
  color: string | null;
  period: string | null;
  subject: string | null;
  room: string | null;
  grade_level: string | null;
  join_code: string | null;
  is_archived: boolean | null;
  created_at: string;
  assignments: { id: string }[];
  enrollments: { id: string; user_id: string | null; student_id: string | null }[];
};

export default function ClassesListClient({
  classes,
}: {
  classes: ClassWithRelations[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived ? cls.is_archived : !cls.is_archived;
    return matchesSearch && matchesArchived;
  });

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">
            My Classes
          </h1>
          <p className="text-base-content/60">
            Manage your classes and view join codes
          </p>
        </div>
        <Link href="/teacher/classes/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="checkbox checkbox-sm checkbox-primary"
          />
          <span className="text-sm text-base-content/70">Show archived</span>
        </label>
      </div>

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">
              {searchQuery ? "No classes found" : "No classes yet"}
            </h3>
            <p className="text-sm text-base-content/60 mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first class to get started"}
            </p>
            {!searchQuery && (
              <Link href="/teacher/classes/new">
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Class
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls, index) => {
            const studentCount = cls.enrollments.length;
            const assignmentCount = cls.assignments.length;

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div
                      className="h-2 rounded-t-xl"
                      style={{ backgroundColor: cls.color || "#6366F1" }}
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base-content truncate">
                            {cls.name}
                          </h3>
                          <p className="text-sm text-base-content/60">
                            {cls.period && `Period ${cls.period}`}
                            {cls.period && cls.subject && " • "}
                            {cls.subject}
                          </p>
                        </div>
                        <div className="dropdown dropdown-end">
                          <label
                            tabIndex={0}
                            className="btn btn-ghost btn-sm btn-square"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </label>
                          <ul
                            tabIndex={0}
                            className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-lg w-48"
                          >
                            <li>
                              <Link href={`/teacher/classes/${cls.id}/settings`}>
                                <Settings className="w-4 h-4" />
                                Settings
                              </Link>
                            </li>
                            <li>
                              <button
                                onClick={() => cls.join_code && copyJoinCode(cls.join_code)}
                              >
                                <Copy className="w-4 h-4" />
                                Copy Join Code
                              </button>
                            </li>
                            <li>
                              <button className="text-warning">
                                <Archive className="w-4 h-4" />
                                Archive
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-base-content/70 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {studentCount} students
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardList className="w-4 h-4" />
                          {assignmentCount} assignments
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-base-200 rounded-lg p-2 mb-4">
                        <div>
                          <p className="text-xs text-base-content/50">Join Code</p>
                          <p className="font-mono font-semibold text-primary">
                            {cls.join_code}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cls.join_code && copyJoinCode(cls.join_code)}
                        >
                          {copiedCode === cls.join_code ? (
                            <span className="text-success text-xs">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      <Link
                        href={`/teacher/classes/${cls.id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors group"
                      >
                        <span className="text-sm font-medium">View Class</span>
                        <ChevronRight className="w-4 h-4 text-base-content/40 group-hover:text-base-content/70" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
