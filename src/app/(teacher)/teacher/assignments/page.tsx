"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Wand2,
  BookOpen,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

type Assignment = {
  id: string;
  name: string;
  description: string | null;
  points_possible: number;
  due_date: string | null;
  assigned_date: string | null;
  category: string | null;
  is_published: boolean | null;
  class_id: string;
  created_at: string;
  class: { id: string; name: string; color: string | null } | null;
};

type ClassData = {
  id: string;
  name: string;
  color: string | null;
  subject: string | null;
};

const ASSIGNMENT_CATEGORIES = [
  { value: "homework", label: "Homework" },
  { value: "quiz", label: "Quiz" },
  { value: "test", label: "Test" },
  { value: "project", label: "Project" },
  { value: "classwork", label: "Classwork" },
  { value: "participation", label: "Participation" },
  { value: "extra_credit", label: "Extra Credit" },
  { value: "other", label: "Other" },
];

const AI_TEMPLATES = [
  {
    id: "worksheet",
    name: "Worksheet Generator",
    icon: FileText,
    description: "Create a practice worksheet with problems",
    prompt: "Create a detailed worksheet assignment",
  },
  {
    id: "quiz",
    name: "Quiz Builder",
    icon: HelpCircle,
    description: "Generate quiz questions with answer key",
    prompt: "Create a quiz with multiple choice and short answer questions",
  },
  {
    id: "project",
    name: "Project Assignment",
    icon: BookOpen,
    description: "Design a comprehensive project assignment",
    prompt: "Create a detailed project assignment with rubric",
  },
  {
    id: "activity",
    name: "Class Activity",
    icon: Sparkles,
    description: "Generate an engaging classroom activity",
    prompt: "Create an interactive classroom activity",
  },
];

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [showAI, setShowAI] = useState(false);
  const [aiTemplate, setAiTemplate] = useState<string | null>(null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiGradeLevel, setAiGradeLevel] = useState("High School");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    points_possible: 100,
    due_date: "",
    assigned_date: new Date().toISOString().split("T")[0],
    category: "homework",
    class_id: "",
    is_published: true,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name, color, subject")
      .eq("teacher_id", user.id)
      .eq("is_archived", false);

    setClasses(classesData || []);

    const classIds = (classesData || []).map((c) => c.id);
    if (classIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          id, name, description, points_possible, due_date, assigned_date,
          category, is_published, class_id, created_at,
          class:classes(id, name, color)
        `)
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      setAssignments((assignmentsData || []) as unknown as Assignment[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === "all" || a.class_id === filterClass;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && a.is_published) ||
      (filterStatus === "draft" && !a.is_published);
    return matchesSearch && matchesClass && matchesStatus;
  });

  const openForm = () => {
    setFormData({
      name: "",
      description: "",
      points_possible: 100,
      due_date: "",
      assigned_date: new Date().toISOString().split("T")[0],
      category: "homework",
      class_id: classes[0]?.id || "",
      is_published: true,
    });
    setEditingAssignment(null);
    setShowForm(true);
    setShowAI(false);
    setAiResult(null);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setShowAI(false);
    setAiResult(null);
    setAiTemplate(null);
    setAiTopic("");
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.class_id || !userId) {
      console.log("Missing required fields:", { name: formData.name, class_id: formData.class_id, userId });
      return;
    }

    setSaving(true);
    
    const insertData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      points_possible: formData.points_possible,
      due_date: formData.due_date || null,
      assigned_date: formData.assigned_date || null,
      category: formData.category,
      class_id: formData.class_id,
      is_published: formData.is_published,
    };
    
    console.log("Inserting assignment:", insertData);
    
    const { data: insertedData, error: insertError } = await supabase
      .from("assignments")
      .insert(insertData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError.message, insertError.code, insertError.details);
      alert(`Failed to create assignment: ${insertError.message || "Unknown error"}`);
      setSaving(false);
      return;
    }

    const { data: assignment, error: fetchError } = await supabase
      .from("assignments")
      .select(`
        id, name, description, points_possible, due_date, assigned_date,
        category, is_published, class_id, created_at,
        class:classes(id, name, color)
      `)
      .eq("id", insertedData.id)
      .single();

    if (fetchError) {
      console.error("Fetch error after insert:", fetchError.message);
    }

    if (assignment) {
      setAssignments([assignment as unknown as Assignment, ...assignments]);

      if (formData.is_published) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("user_id")
          .eq("class_id", formData.class_id)
          .eq("is_active", true)
          .not("user_id", "is", null);

        const className = classes.find((c) => c.id === formData.class_id)?.name || "Class";

        if (enrollments && enrollments.length > 0) {
          const notifications = enrollments.map((e) => ({
            user_id: e.user_id!,
            type: "assignment",
            title: `New Assignment: ${formData.name.trim()}`,
            message: `${className}: ${formData.points_possible} points${formData.due_date ? ` - Due ${new Date(formData.due_date).toLocaleDateString()}` : ""}`,
            link: "/student/assignments",
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }

      resetForm();
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingAssignment || !formData.name.trim()) return;

    setSaving(true);
    const { error } = await supabase
      .from("assignments")
      .update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        points_possible: formData.points_possible,
        due_date: formData.due_date || null,
        assigned_date: formData.assigned_date || null,
        category: formData.category,
        is_published: formData.is_published,
      })
      .eq("id", editingAssignment.id);

    if (!error) {
      setAssignments(
        assignments.map((a) =>
          a.id === editingAssignment.id
            ? {
                ...a,
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                points_possible: formData.points_possible,
                due_date: formData.due_date || null,
                assigned_date: formData.assigned_date || null,
                category: formData.category,
                is_published: formData.is_published,
              }
            : a
        )
      );
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This will also delete all associated grades.")) return;

    const { error } = await supabase.from("assignments").delete().eq("id", id);

    if (!error) {
      setAssignments(assignments.filter((a) => a.id !== id));
    }
  };

  const handleTogglePublish = async (assignment: Assignment) => {
    const { error } = await supabase
      .from("assignments")
      .update({ is_published: !assignment.is_published })
      .eq("id", assignment.id);

    if (!error) {
      setAssignments(
        assignments.map((a) =>
          a.id === assignment.id ? { ...a, is_published: !a.is_published } : a
        )
      );

      if (!assignment.is_published) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("user_id")
          .eq("class_id", assignment.class_id)
          .eq("is_active", true)
          .not("user_id", "is", null);

        const className = assignment.class?.name || "Class";

        if (enrollments && enrollments.length > 0) {
          const notifications = enrollments.map((e) => ({
            user_id: e.user_id!,
            type: "assignment",
            title: `New Assignment: ${assignment.name}`,
            message: `${className}: ${assignment.points_possible} points${assignment.due_date ? ` - Due ${new Date(assignment.due_date).toLocaleDateString()}` : ""}`,
            link: "/student/assignments",
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }
    }
  };

  const handleDuplicate = async (assignment: Assignment) => {
    setSaving(true);
    const { data: newAssignment, error } = await supabase
      .from("assignments")
      .insert({
        name: `${assignment.name} (Copy)`,
        description: assignment.description,
        points_possible: assignment.points_possible,
        due_date: null,
        assigned_date: new Date().toISOString().split("T")[0],
        category: assignment.category,
        class_id: assignment.class_id,
        is_published: false,
      })
      .select(`
        id, name, description, points_possible, due_date, assigned_date,
        category, is_published, class_id, created_at,
        class:classes(id, name, color)
      `)
      .single();

    if (!error && newAssignment) {
      setAssignments([newAssignment as unknown as Assignment, ...assignments]);
    }
    setSaving(false);
  };

  const startEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      name: assignment.name,
      description: assignment.description || "",
      points_possible: assignment.points_possible,
      due_date: assignment.due_date ? assignment.due_date.split("T")[0] : "",
      assigned_date: assignment.assigned_date ? assignment.assigned_date.split("T")[0] : "",
      category: assignment.category || "homework",
      class_id: assignment.class_id,
      is_published: assignment.is_published ?? true,
    });
    setShowForm(true);
    setShowAI(false);
  };

  const generateWithAI = async () => {
    if (!aiTemplate || !aiTopic.trim() || !formData.class_id) return;

    setAiGenerating(true);
    const selectedClass = classes.find((c) => c.id === formData.class_id);
    const template = AI_TEMPLATES.find((t) => t.id === aiTemplate);

    const prompt = `Create a ${template?.name?.toLowerCase()} for the following:

Subject/Class: ${selectedClass?.subject || selectedClass?.name || "General"}
Grade Level: ${aiGradeLevel}
Topic: ${aiTopic}
Assignment Type: ${formData.category}

Please provide:
1. A clear, engaging title for the assignment (start with "Title: ")
2. Detailed instructions for students
3. Learning objectives
4. ${aiTemplate === "quiz" ? "Questions with answer key" : aiTemplate === "project" ? "Rubric or grading criteria" : "Practice problems or activities"}
5. Suggested point value and time estimate

Format your response in a clear, organized manner that a teacher can directly use or adapt.`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tool: aiTemplate === "quiz" ? "quiz" : "lesson-plan",
          classId: formData.class_id,
        }),
      });

      const data = await response.json();
      if (data.response) {
        setAiResult(data.response);
        
        const titleMatch = data.response.match(/(?:^|\n)#?\s*(?:Title:?\s*)?([^\n]+)/i);
        if (titleMatch) {
          setFormData((prev) => ({
            ...prev,
            name: titleMatch[1].replace(/[#*:]/g, "").trim().slice(0, 100),
            description: data.response,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            name: `${aiTopic} - ${template?.name}`,
            description: data.response,
          }));
        }
      } else if (data.error) {
        console.error("AI error:", data.error);
        alert("Failed to generate assignment. Please try again.");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate assignment. Please try again.");
    }

    setAiGenerating(false);
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.is_published) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-base-300 text-base-content/70 text-xs flex items-center gap-1">
          <EyeOff className="w-3 h-3" />
          Draft
        </span>
      );
    }
    if (assignment.due_date) {
      const due = new Date(assignment.due_date);
      const now = new Date();
      if (due < now) {
        return (
          <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Past Due
          </span>
        );
      }
      const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 3) {
        return (
          <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Due Soon
          </span>
        );
      }
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    );
  };

  const classColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">Assignments</h1>
          <p className="text-base-content/60">Create and manage assignments for your classes</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No classes yet</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Create a class first before adding assignments
            </p>
            <Button variant="primary" onClick={() => window.location.href = "/teacher/classes"}>
              Go to Classes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">Assignments</h1>
          <p className="text-base-content/60">Create and manage assignments for your classes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { openForm(); setShowAI(true); }}>
            <Wand2 className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button variant="primary" onClick={openForm}>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-base-300 bg-base-100"
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="px-4 py-2.5 rounded-lg border border-base-300 bg-base-100"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">
                      {editingAssignment ? "Edit Assignment" : "New Assignment"}
                    </h3>
                    {!editingAssignment && (
                      <div className="flex rounded-lg border border-base-300 overflow-hidden">
                        <button
                          onClick={() => setShowAI(false)}
                          className={`px-3 py-1 text-sm ${!showAI ? "bg-primary text-primary-content" : "bg-base-100"}`}
                        >
                          Manual
                        </button>
                        <button
                          onClick={() => setShowAI(true)}
                          className={`px-3 py-1 text-sm flex items-center gap-1 ${showAI ? "bg-primary text-primary-content" : "bg-base-100"}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Assist
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={resetForm} className="p-1 hover:bg-base-200 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {showAI && !editingAssignment && !aiResult && (
                  <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-medium">AI Assignment Generator</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {AI_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setAiTemplate(template.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            aiTemplate === template.id
                              ? "border-primary bg-primary/10"
                              : "border-base-300 hover:border-primary/50"
                          }`}
                        >
                          <template.icon className={`w-5 h-5 mb-2 ${aiTemplate === template.id ? "text-primary" : "text-base-content/50"}`} />
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-base-content/50 mt-1">{template.description}</p>
                        </button>
                      ))}
                    </div>

                    {aiTemplate && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">Topic / Learning Objective</label>
                          <input
                            type="text"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="e.g., Pythagorean theorem, Civil War causes, Photosynthesis..."
                            className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Grade Level</label>
                          <select
                            value={aiGradeLevel}
                            onChange={(e) => setAiGradeLevel(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100"
                          >
                            <option>Elementary (K-5)</option>
                            <option>Middle School (6-8)</option>
                            <option>High School</option>
                            <option>College/University</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Class</label>
                        <select
                          value={formData.class_id}
                          onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100"
                        >
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100"
                        >
                          {ASSIGNMENT_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={generateWithAI}
                        disabled={!aiTemplate || !aiTopic.trim() || aiGenerating}
                        isLoading={aiGenerating}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Assignment
                      </Button>
                    </div>
                  </div>
                )}

                {aiResult && (
                  <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20 max-h-[300px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-secondary flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        AI Generated Content
                      </span>
                      <button
                        onClick={() => { setAiResult(null); setAiTemplate(null); setAiTopic(""); }}
                        className="text-xs text-base-content/50 hover:text-base-content"
                      >
                        Regenerate
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none text-base-content/80">
                      <ReactMarkdown>{aiResult}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Assignment Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Chapter 5 Quiz"
                      className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {!editingAssignment && !showAI && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Class *</label>
                      <select
                        value={formData.class_id}
                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description / Instructions</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Instructions or details about the assignment..."
                    rows={aiResult ? 10 : 3}
                    className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Points</label>
                    <input
                      type="number"
                      value={formData.points_possible}
                      onChange={(e) => setFormData({ ...formData, points_possible: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {!showAI && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {ASSIGNMENT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Assigned Date</label>
                    <input
                      type="date"
                      value={formData.assigned_date}
                      onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  <span className="text-sm">Publish immediately (students can see this assignment)</span>
                </label>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={editingAssignment ? handleUpdate : handleCreate}
                    disabled={!formData.name.trim() || !formData.class_id || saving}
                    isLoading={saving}
                  >
                    {editingAssignment ? "Save Changes" : "Create Assignment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No assignments</h3>
            <p className="text-sm text-base-content/60 mb-4">
              {searchQuery || filterClass !== "all" || filterStatus !== "all"
                ? "No assignments match your filters"
                : "Create your first assignment to get started"}
            </p>
            {!showForm && (
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { openForm(); setShowAI(true); }}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
                <Button variant="primary" onClick={openForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`hover:shadow-md transition-shadow ${!assignment.is_published ? "opacity-75" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-2 h-full min-h-[80px] rounded-full ${
                        assignment.class?.color || classColors[index % classColors.length]
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-base-content/50">
                          {assignment.class?.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-base-200 text-base-content/70 text-xs capitalize">
                          {assignment.category?.replace("_", " ")}
                        </span>
                        {getStatusBadge(assignment)}
                      </div>
                      <h3 className="font-semibold text-base-content text-lg">{assignment.name}</h3>
                      {assignment.description && (
                        <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-base-content/50 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-primary">
                          {assignment.points_possible} pts
                        </span>
                        {assignment.assigned_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                          </span>
                        )}
                        {assignment.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePublish(assignment)}
                        className={`p-2 rounded-lg hover:bg-base-200 transition-colors ${
                          assignment.is_published ? "text-success" : "text-base-content/50"
                        }`}
                        title={assignment.is_published ? "Unpublish" : "Publish"}
                      >
                        {assignment.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDuplicate(assignment)}
                        className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-primary transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEdit(assignment)}
                        className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 hover:text-error transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-base-200 rounded-lg">
        <h4 className="font-medium text-base-content mb-2">Quick Stats</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-base-content/50">Total Assignments</p>
            <p className="text-xl font-semibold text-base-content">{assignments.length}</p>
          </div>
          <div>
            <p className="text-base-content/50">Published</p>
            <p className="text-xl font-semibold text-success">{assignments.filter(a => a.is_published).length}</p>
          </div>
          <div>
            <p className="text-base-content/50">Drafts</p>
            <p className="text-xl font-semibold text-base-content/70">{assignments.filter(a => !a.is_published).length}</p>
          </div>
          <div>
            <p className="text-base-content/50">Past Due</p>
            <p className="text-xl font-semibold text-error">
              {assignments.filter(a => a.due_date && new Date(a.due_date) < new Date()).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
