"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  X,
  Upload,
  Download,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  student_id_number: string;
  grade_level: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  is_active: boolean;
}

const mockStudents: Student[] = [
  {
    id: "1",
    first_name: "Emma",
    last_name: "Thompson",
    email: "emma.t@student.edu",
    student_id_number: "STU001",
    grade_level: "6th Grade",
    parent_name: "Sarah Thompson",
    parent_email: "sarah.t@email.com",
    parent_phone: "(555) 123-4567",
    is_active: true,
  },
  {
    id: "2",
    first_name: "Liam",
    last_name: "Martinez",
    email: "liam.m@student.edu",
    student_id_number: "STU002",
    grade_level: "6th Grade",
    parent_name: "Maria Martinez",
    parent_email: "maria.m@email.com",
    parent_phone: "(555) 234-5678",
    is_active: true,
  },
  {
    id: "3",
    first_name: "Olivia",
    last_name: "Johnson",
    email: "olivia.j@student.edu",
    student_id_number: "STU003",
    grade_level: "6th Grade",
    parent_name: "Michael Johnson",
    parent_email: "michael.j@email.com",
    parent_phone: "(555) 345-6789",
    is_active: true,
  },
  {
    id: "4",
    first_name: "Noah",
    last_name: "Williams",
    email: "noah.w@student.edu",
    student_id_number: "STU004",
    grade_level: "6th Grade",
    parent_name: "Jennifer Williams",
    parent_email: "jennifer.w@email.com",
    parent_phone: "(555) 456-7890",
    is_active: true,
  },
  {
    id: "5",
    first_name: "Ava",
    last_name: "Brown",
    email: "ava.b@student.edu",
    student_id_number: "STU005",
    grade_level: "6th Grade",
    parent_name: "David Brown",
    parent_email: "david.b@email.com",
    parent_phone: "(555) 567-8901",
    is_active: false,
  },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = showActiveOnly ? s.is_active : true;
    return matchesSearch && matchesActive;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-base-content">
            Students
          </h1>
          <p className="text-base-content/60 mt-1">
            Manage your student roster across all classes
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />}>
            Import CSV
          </Button>
          <Button
            variant="sync"
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={cn(
              "px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
              showActiveOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-base-300 text-base-content/60 hover:border-base-content/30"
            )}
          >
            <Filter className="w-4 h-4 inline-block mr-2" />
            Active Only
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card p-4">
          <div className="text-2xl font-bold text-base-content">
            {students.filter((s) => s.is_active).length}
          </div>
          <div className="text-sm text-base-content/60">Active Students</div>
        </div>
        <div className="stat-card p-4">
          <div className="text-2xl font-bold text-base-content">
            {students.length}
          </div>
          <div className="text-sm text-base-content/60">Total Students</div>
        </div>
        <div className="stat-card p-4">
          <div className="text-2xl font-bold text-base-content">3</div>
          <div className="text-sm text-base-content/60">Classes</div>
        </div>
        <div className="stat-card p-4">
          <div className="text-2xl font-bold text-success">92%</div>
          <div className="text-sm text-base-content/60">Avg. Grade</div>
        </div>
      </div>

      {/* Students Table */}
      <Card variant="elevated" animate={false}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-base-content">
              Student Roster
            </h2>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-300">
                <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">
                  Student
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">
                  ID
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">
                  Grade
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">
                  Parent Contact
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-base-content/60">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-base-content/60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-base-300/50 hover:bg-base-200/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center text-white font-medium">
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-base-content">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-base-content/60">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-base-content/70">
                    {student.student_id_number}
                  </td>
                  <td className="px-6 py-4 text-base-content/70">
                    {student.grade_level}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-base-content">{student.parent_name}</div>
                      <div className="text-base-content/60 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {student.parent_email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        student.is_active
                          ? "bg-success/10 text-success"
                          : "bg-base-300 text-base-content/60"
                      )}
                    >
                      {student.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="p-2 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-base-content/60" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-error/10 transition-colors">
                        <Trash2 className="w-4 h-4 text-error/60" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-base-content mb-1">
              No students found
            </h3>
            <p className="text-base-content/60">
              {searchQuery
                ? "Try adjusting your search query"
                : "Add your first student to get started"}
            </p>
          </div>
        )}
      </Card>

      {/* Create Student Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <StudentModal
            onClose={() => setShowCreateModal(false)}
            onSave={(student) => {
              setStudents([...students, { ...student, id: Date.now().toString() }]);
              setShowCreateModal(false);
            }}
          />
        )}
        {selectedStudent && (
          <StudentModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onSave={(updated) => {
              setStudents(
                students.map((s) =>
                  s.id === selectedStudent.id ? { ...updated, id: s.id } : s
                )
              );
              setSelectedStudent(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentModal({
  student,
  onClose,
  onSave,
}: {
  student?: Student;
  onClose: () => void;
  onSave: (student: Omit<Student, "id">) => void;
}) {
  const [formData, setFormData] = useState({
    first_name: student?.first_name || "",
    last_name: student?.last_name || "",
    email: student?.email || "",
    student_id_number: student?.student_id_number || "",
    grade_level: student?.grade_level || "",
    parent_name: student?.parent_name || "",
    parent_email: student?.parent_email || "",
    parent_phone: student?.parent_phone || "",
    is_active: student?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
        className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-base-300 sticky top-0 bg-base-100">
          <h2 className="text-xl font-semibold text-base-content">
            {student ? "Edit Student" : "Add New Student"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">
                Student ID
              </label>
              <input
                type="text"
                value={formData.student_id_number}
                onChange={(e) =>
                  setFormData({ ...formData, student_id_number: e.target.value })
                }
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
                className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-base-content mb-1">
              Student Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="border-t border-base-300 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-base-content mb-3">
              Parent/Guardian Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content mb-1">
                  Parent Name
                </label>
                <input
                  type="text"
                  value={formData.parent_name}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-1">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content mb-1">
                    Parent Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="checkbox checkbox-primary"
            />
            <label htmlFor="is_active" className="text-sm text-base-content">
              Student is active
            </label>
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
              {student ? "Save Changes" : "Add Student"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
