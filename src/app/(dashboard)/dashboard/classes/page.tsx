"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Users,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Class {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  period: string;
  room: string;
  color: string;
  studentCount: number;
  assignmentCount: number;
}

const mockClasses: Class[] = [
  {
    id: "1",
    name: "6th Grade Language Arts",
    subject: "Language Arts",
    grade_level: "6th Grade",
    period: "1st Period",
    room: "Room 204",
    color: "#6366F1",
    studentCount: 28,
    assignmentCount: 12,
  },
  {
    id: "2",
    name: "6th Grade Social Studies",
    subject: "Social Studies",
    grade_level: "6th Grade",
    period: "3rd Period",
    room: "Room 204",
    color: "#3B82F6",
    studentCount: 26,
    assignmentCount: 8,
  },
  {
    id: "3",
    name: "Creative Writing Elective",
    subject: "English",
    grade_level: "6th-8th Grade",
    period: "5th Period",
    room: "Room 108",
    color: "#10B981",
    studentCount: 18,
    assignmentCount: 5,
  },
];

const classColors = [
  "#6366F1",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>(mockClasses);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-base-content">
            Classes
          </h1>
          <p className="text-base-content/60 mt-1">
            Manage your classes and student rosters
          </p>
        </div>
        <Button
          variant="sync"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Class
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
        <input
          type="text"
          placeholder="Search classes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Classes Grid */}
      {filteredClasses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem, index) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/dashboard/classes/${classItem.id}`}>
                <Card
                  variant="elevated"
                  animate={false}
                  className="h-full hover:border-primary/30 transition-all cursor-pointer group"
                >
                  {/* Color Bar */}
                  <div
                    className="h-2 rounded-t-xl"
                    style={{ backgroundColor: classItem.color }}
                  />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${classItem.color}20` }}
                      >
                        <BookOpen
                          className="w-6 h-6"
                          style={{ color: classItem.color }}
                        />
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMenu(
                              activeMenu === classItem.id ? null : classItem.id
                            );
                          }}
                          className="p-1.5 rounded-lg hover:bg-base-200 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-base-content/50" />
                        </button>
                        <AnimatePresence>
                          {activeMenu === classItem.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-base-100 rounded-xl shadow-xl border border-base-300 py-1 z-10"
                              onClick={(e) => e.preventDefault()}
                            >
                              <button className="w-full px-4 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button className="w-full px-4 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2">
                                <Archive className="w-4 h-4" />
                                Archive
                              </button>
                              <button className="w-full px-4 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2 text-error">
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-base-content mb-1 group-hover:text-primary transition-colors">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                      {classItem.period} • {classItem.room}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-base-content/60">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {classItem.studentCount} students
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {classItem.assignmentCount} assignments
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card variant="elevated" animate={false} className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-base-content/40" />
          </div>
          <h3 className="text-lg font-semibold text-base-content mb-2">
            {searchQuery ? "No classes found" : "No classes yet"}
          </h3>
          <p className="text-base-content/60 mb-6 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search query"
              : "Create your first class to start managing students and grades"}
          </p>
          {!searchQuery && (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-5 h-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Class
            </Button>
          )}
        </Card>
      )}

      {/* Create Class Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateClassModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(newClass) => {
              setClasses([...classes, { ...newClass, id: Date.now().toString() }]);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateClassModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (classData: Omit<Class, "id">) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    grade_level: "",
    period: "",
    room: "",
    color: "#6366F1",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      studentCount: 0,
      assignmentCount: 0,
    });
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
            Create New Class
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
              Class Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., 6th Grade Language Arts"
              className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="e.g., Language Arts"
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Grade Level
              </label>
              <input
                type="text"
                value={formData.grade_level}
                onChange={(e) =>
                  setFormData({ ...formData, grade_level: e.target.value })
                }
                placeholder="e.g., 6th Grade"
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Period
              </label>
              <input
                type="text"
                value={formData.period}
                onChange={(e) =>
                  setFormData({ ...formData, period: e.target.value })
                }
                placeholder="e.g., 1st Period"
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Room
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) =>
                  setFormData({ ...formData, room: e.target.value })
                }
                placeholder="e.g., Room 204"
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {classColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-base-content"
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="sync" className="flex-1">
              Create Class
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
