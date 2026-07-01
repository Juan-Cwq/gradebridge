"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ClipboardList,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Upload,
  FileText,
  CheckCircle2 as CheckCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { createBrowserClient } from "@supabase/ssr";
import type { Annotation } from "@/components/ui/DocumentAnnotator";

const DocumentAnnotator = dynamic(() => import("@/components/ui/DocumentAnnotator"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 gap-2 text-base-content/60">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading viewer…
    </div>
  ),
});

type Assignment = {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  points_possible: number;
  category?: string;
  max_attempts?: number | null;
  submission_type?: string | null;
  class: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

type FileSubmission = {
  id: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  status: string;
  submitted_at: string;
  text_content: string | null;
};

type MyGrade = {
  points_earned: number | null;
  percentage: number | null;
  feedback: string | null;
  status: string | null;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  points?: number;
};

type QuizData = {
  title: string;
  questions: QuizQuestion[];
  totalPoints?: number;
  timeLimit?: number;
};

type PriorSubmission = {
  score: number;
  total_points: number;
  percentage: number;
  submitted_at: string;
  attempt_number?: number;
};

function parseQuizData(description: string | null): QuizData | null {
  if (!description) return null;
  try {
    const cleaned = description
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed as QuizData;
    }
  } catch {
    const lines = description.split('\n');
    const questions: QuizQuestion[] = [];
    let currentQuestion: Partial<QuizQuestion> | null = null;
    let titleMatch = description.match(/Title:\s*(.+)/i);

    for (const line of lines) {
      const questionMatch = line.match(/^(\d+)\.\s*(.+)/);
      const optionMatch = line.match(/^([A-D])\)\s*(.+)/i);

      if (questionMatch) {
        if (currentQuestion && currentQuestion.question && currentQuestion.options) {
          questions.push(currentQuestion as QuizQuestion);
        }
        currentQuestion = { question: questionMatch[2], options: [], correctIndex: 0 };
      } else if (optionMatch && currentQuestion) {
        const optionText = optionMatch[2];
        const isCorrect = optionText.includes('✓') || optionText.includes('*');
        const cleanOption = optionText.replace(/[✓*]/g, '').trim();
        if (isCorrect) {
          currentQuestion.correctIndex = currentQuestion.options?.length || 0;
        }
        currentQuestion.options = [...(currentQuestion.options || []), cleanOption];
      }
    }

    if (currentQuestion && currentQuestion.question && currentQuestion.options && currentQuestion.options.length > 0) {
      questions.push(currentQuestion as QuizQuestion);
    }

    if (questions.length > 0) {
      return { title: titleMatch ? titleMatch[1] : 'Quiz', questions };
    }
  }
  return null;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priorSubmission, setPriorSubmission] = useState<PriorSubmission | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);

  // File-submission (project) state
  const [fileMode, setFileMode] = useState(false);
  const [mySubmission, setMySubmission] = useState<FileSubmission | null>(null);
  const [myGrade, setMyGrade] = useState<MyGrade | null>(null);
  const [myAnnotations, setMyAnnotations] = useState<Annotation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        .map((e) => e.class as unknown as { id: string; name: string } | null)
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
          category,
          max_attempts,
          submission_type,
          class:classes(id, name, color)
        `)
        .in("class_id", classIds)
        .eq("is_published", true)
        .order("due_date", { ascending: true });

      setAssignments((assignmentsData as unknown as Assignment[]) || []);
      setLoading(false);
    };

    fetchAssignments();
  }, [supabase]);

  const filteredAssignments = assignments.filter((a) => {
    const now = new Date();
    const dueDate = a.due_date ? new Date(a.due_date) : null;
    if (classFilter !== "all" && a.class?.id !== classFilter) return false;
    if (filter === "upcoming") return dueDate && dueDate >= now;
    if (filter === "past") return dueDate && dueDate < now;
    return true;
  });

  const getUrgencyBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-medium">Past due</span>;
    if (diffDays === 0) return <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-medium">Due today</span>;
    if (diffDays <= 3) return <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">Due in {diffDays} days</span>;
    return <span className="px-2 py-0.5 rounded-full bg-base-300 text-base-content/60 text-xs font-medium">Due in {diffDays} days</span>;
  };

  const classColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

  const loadFileSubmission = async (assignment: Assignment) => {
    setCheckingSubmission(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCheckingSubmission(false);
      return;
    }

    const { data: sub } = await supabase
      .from("submissions")
      .select("id, file_url, file_name, file_type, status, submitted_at, text_content")
      .eq("assignment_id", assignment.id)
      .eq("student_id", user.id)
      .maybeSingle();

    setMySubmission((sub as FileSubmission) || null);

    const { data: grade } = await supabase
      .from("grades")
      .select("points_earned, percentage, feedback, status")
      .eq("assignment_id", assignment.id)
      .eq("student_id", user.id)
      .maybeSingle();

    setMyGrade((grade as MyGrade) || null);

    if (sub?.id) {
      const { data: anns } = await supabase
        .from("submission_annotations")
        .select("id, page, x, y, width, height, type, color, body")
        .eq("submission_id", sub.id);
      setMyAnnotations((anns as Annotation[]) || []);
    }

    setCheckingSubmission(false);
  };

  const openAssignment = async (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setFileMode(false);
    setMySubmission(null);
    setMyGrade(null);
    setMyAnnotations([]);
    setUploadError(null);
    setQuizStarted(false);
    setCurrentQuestion(0);
    setQuizSubmitted(false);
    setSubmitError(null);
    setPriorSubmission(null);
    setAttemptsUsed(0);
    setMaxAttempts(Math.max(1, assignment.max_attempts ?? 1));

    if (assignment.submission_type === "file") {
      setFileMode(true);
      setQuizData(null);
      await loadFileSubmission(assignment);
      return;
    }

    const parsed = assignment.category === "quiz" ? parseQuizData(assignment.description) : null;
    setQuizData(parsed);
    setSelectedAnswers(parsed ? new Array(parsed.questions.length).fill(null) : []);

    if (parsed) {
      setCheckingSubmission(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch all attempts; keep the best score for display and gradebook
        const { data: submissions } = await supabase
          .from("quiz_submissions")
          .select("score, total_points, percentage, submitted_at, attempt_number")
          .eq("student_id", user.id)
          .eq("assignment_id", assignment.id)
          .order("percentage", { ascending: false });

        if (submissions && submissions.length > 0) {
          setAttemptsUsed(submissions.length);
          const best = submissions[0] as PriorSubmission;
          // If no attempts remain, lock with the best score shown
          if (submissions.length >= Math.max(1, assignment.max_attempts ?? 1)) {
            setPriorSubmission(best);
            setQuizSubmitted(true);
          }
        }
      }
      setCheckingSubmission(false);
    }
  };

  const closeAssignment = () => {
    setViewingAssignment(null);
    setQuizData(null);
    setQuizStarted(false);
    setQuizSubmitted(false);
    setPriorSubmission(null);
    setSubmitError(null);
    setFileMode(false);
    setMySubmission(null);
    setMyGrade(null);
    setMyAnnotations([]);
    setUploadError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingAssignment) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File is too large (max 25 MB).");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploadError("You must be logged in to submit.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() || "dat";
    const path = `${viewingAssignment.id}/${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { data: uploaded, error: uploadErr } = await supabase.storage
      .from("assignment-submissions")
      .upload(path, file, { upsert: true });

    if (uploadErr || !uploaded) {
      setUploadError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("assignment-submissions")
      .getPublicUrl(uploaded.path);

    const row = {
      assignment_id: viewingAssignment.id,
      student_id: user.id,
      file_path: uploaded.path,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };

    const { data: saved, error: saveErr } = await supabase
      .from("submissions")
      .upsert(row, { onConflict: "assignment_id,student_id" })
      .select("id, file_url, file_name, file_type, status, submitted_at, text_content")
      .single();

    if (saveErr || !saved) {
      setUploadError("Couldn't record your submission. Please try again.");
      setUploading(false);
      return;
    }

    setMySubmission(saved as FileSubmission);
    setMyAnnotations([]);
    setUploading(false);
    e.target.value = "";
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
  };

  const selectAnswer = (optionIndex: number) => {
    if (quizSubmitted) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!quizData || !viewingAssignment) return;
    setSubmitting(true);
    setSubmitError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError("You must be logged in to submit.");
      setSubmitting(false);
      return;
    }

    let correct = 0;
    quizData.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) correct++;
    });
    const total = quizData.questions.length;
    const percentage = Math.round((correct / total) * 100);
    const thisAttempt = attemptsUsed + 1;

    const { error } = await supabase.from("quiz_submissions").insert({
      student_id: user.id,
      assignment_id: viewingAssignment.id,
      score: correct,
      total_points: total,
      percentage,
      answers: selectedAnswers,
      attempt_number: thisAttempt,
    });

    if (error) {
      setSubmitError("Failed to save your score. Please try again.");
      setSubmitting(false);
      return;
    }

    setAttemptsUsed(thisAttempt);

    // Record/refresh the gradebook grade using the best score across attempts.
    const pointsPossible = viewingAssignment.points_possible || total;
    const bestPercentage = priorSubmission
      ? Math.max(priorSubmission.percentage, percentage)
      : percentage;
    const pointsEarned = Math.round((bestPercentage / 100) * pointsPossible);

    try {
      const { data: existingGrade } = await supabase
        .from("grades")
        .select("id")
        .eq("student_id", user.id)
        .eq("assignment_id", viewingAssignment.id)
        .maybeSingle();

      const gradePayload = {
        points_earned: pointsEarned,
        percentage: bestPercentage,
        status: "graded",
        submitted_at: new Date().toISOString(),
        graded_at: new Date().toISOString(),
      };

      if (existingGrade) {
        await supabase.from("grades").update(gradePayload).eq("id", existingGrade.id);
      } else {
        await supabase.from("grades").insert({
          student_id: user.id,
          assignment_id: viewingAssignment.id,
          ...gradePayload,
        });
      }
    } catch (gradeErr) {
      console.error("Failed to record grade:", gradeErr);
    }

    setQuizSubmitted(true);
    setSubmitting(false);
  };

  const retakeQuiz = () => {
    if (!quizData) return;
    setSelectedAnswers(new Array(quizData.questions.length).fill(null));
    setCurrentQuestion(0);
    setQuizSubmitted(false);
    setQuizStarted(true);
    setSubmitError(null);
  };

  const getScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quizData.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) correct++;
    });
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

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
          {(["all", "upcoming", "past"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f ? "bg-secondary text-secondary-content" : "bg-base-200 hover:bg-base-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
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
              {classes.length === 0 ? "Join a class to see assignments" : "No assignments match your filters"}
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
              onClick={() => openAssignment(assignment)}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-md hover:border-secondary/30 transition-all">
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-base-content truncate">{assignment.name}</h3>
                        {assignment.category === "quiz" && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium">Quiz</span>
                        )}
                        {assignment.submission_type === "file" && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                            <Upload className="w-3 h-3" /> Upload
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-base-content/60">{assignment.class?.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-base-content">{assignment.points_possible} pts</p>
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

      {/* Assignment/Quiz Modal */}
      <AnimatePresence>
        {viewingAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={closeAssignment}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-base-100 rounded-2xl shadow-xl w-full max-h-[90vh] overflow-hidden ${
                fileMode ? "max-w-5xl" : "max-w-3xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-base-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-base-content">{viewingAssignment.name}</h2>
                  <p className="text-sm text-base-content/60">{viewingAssignment.class?.name}</p>
                </div>
                <button onClick={closeAssignment} className="p-2 hover:bg-base-200 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                {checkingSubmission ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="loading loading-spinner loading-lg text-secondary"></div>
                  </div>
                ) : fileMode ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 pb-4 border-b border-base-200 text-sm text-base-content/60">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {viewingAssignment.due_date
                          ? new Date(viewingAssignment.due_date).toLocaleDateString("en-US", {
                              month: "long", day: "numeric", year: "numeric",
                            })
                          : "No due date"}
                      </span>
                      <span className="font-medium text-base-content">
                        {viewingAssignment.points_possible} points
                      </span>
                    </div>

                    {viewingAssignment.description && (
                      <div className="prose prose-sm max-w-none rounded-lg border border-base-200 bg-base-200/30 p-4 max-h-52 overflow-y-auto">
                        <ReactMarkdown>{viewingAssignment.description}</ReactMarkdown>
                      </div>
                    )}

                    {myGrade && myGrade.status === "graded" && (
                      <div className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-success/10 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-success leading-none">
                            {myGrade.points_earned ?? "--"}
                          </span>
                          <span className="text-[10px] text-base-content/50">
                            / {viewingAssignment.points_possible}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-success">Graded</p>
                          {myGrade.feedback ? (
                            <p className="text-sm text-base-content/80 mt-1 whitespace-pre-wrap">
                              {myGrade.feedback}
                            </p>
                          ) : (
                            <p className="text-sm text-base-content/50 mt-1 italic">
                              No written feedback. See document comments below.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {mySubmission ? (
                      <div className="rounded-xl border border-base-200 p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{mySubmission.file_name}</p>
                            <p className="text-xs text-base-content/50">
                              Submitted {new Date(mySubmission.submitted_at).toLocaleString()}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs flex items-center gap-1 flex-shrink-0">
                            <CheckCircle className="w-3 h-3" /> Submitted
                          </span>
                        </div>

                        {myGrade?.status === "graded" && mySubmission.file_url && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4 text-primary" />
                              Your teacher&apos;s marks on your document
                              {myAnnotations.length > 0 && (
                                <span className="text-xs text-base-content/50 font-normal">
                                  ({myAnnotations.length})
                                </span>
                              )}
                            </p>
                            <div className="h-[55vh] rounded-lg border border-base-300 overflow-hidden">
                              <DocumentAnnotator
                                fileUrl={mySubmission.file_url}
                                fileType={mySubmission.file_type}
                                fileName={mySubmission.file_name}
                                annotations={myAnnotations}
                                editable={false}
                              />
                            </div>
                          </div>
                        )}

                        {myGrade?.status !== "graded" && (
                          <label className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-base-300 hover:bg-base-200 cursor-pointer text-sm">
                            {uploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            {uploading ? "Uploading…" : "Replace file"}
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.txt"
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-300 hover:border-primary/50 hover:bg-primary/5 transition-colors p-8 cursor-pointer text-center">
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">
                            {uploading ? "Uploading…" : "Upload your submission"}
                          </p>
                          <p className="text-sm text-base-content/50">
                            PDF, image, or document (max 25 MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.ppt,.pptx,.txt"
                        />
                      </label>
                    )}

                    {uploadError && (
                      <p className="text-error text-sm text-center">{uploadError}</p>
                    )}
                  </div>
                ) : quizData ? (
                  <>
                    {/* Already submitted — show prior score */}
                    {quizSubmitted && priorSubmission && !quizStarted && (
                      <div className="text-center py-8">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          priorSubmission.percentage >= 70 ? "bg-success/10" : "bg-error/10"
                        }`}>
                          <span className={`text-3xl font-bold ${
                            priorSubmission.percentage >= 70 ? "text-success" : "text-error"
                          }`}>
                            {priorSubmission.percentage}%
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-1">
                          {maxAttempts > 1 ? "Best Score" : "Already Submitted"}
                        </h3>
                        <p className="text-base-content/60 mb-1">
                          {priorSubmission.score} out of {priorSubmission.total_points} correct
                        </p>
                        <p className="text-sm text-base-content/40">
                          Submitted {new Date(priorSubmission.submitted_at).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                        <p className="mt-4 text-sm text-base-content/50 italic">
                          {maxAttempts > 1
                            ? `You've used all ${maxAttempts} attempts.`
                            : "Quizzes can only be submitted once."}
                        </p>
                      </div>
                    )}

                    {/* Start screen */}
                    {!quizStarted && !quizSubmitted && (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Play className="w-10 h-10 text-secondary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{quizData.title || "Quiz"}</h3>
                        <p className="text-base-content/60 mb-2">
                          {quizData.questions.length} questions • {viewingAssignment.points_possible} points
                        </p>
                        <p className="text-sm text-warning mb-6">
                          {maxAttempts > 1
                            ? `Attempt ${attemptsUsed + 1} of ${maxAttempts} — your highest score counts.`
                            : "You can only submit this quiz once."}
                        </p>
                        <button
                          onClick={startQuiz}
                          className="px-8 py-3 bg-secondary text-secondary-content rounded-xl font-semibold hover:bg-secondary/90 transition-colors"
                        >
                          {attemptsUsed > 0 ? "Start Next Attempt" : "Start Quiz"}
                        </button>
                      </div>
                    )}

                    {/* Quiz in progress */}
                    {quizStarted && !quizSubmitted && (
                      <div>
                        <div className="mb-6">
                          <div className="flex justify-between text-sm text-base-content/60 mb-2">
                            <span>Question {currentQuestion + 1} of {quizData.questions.length}</span>
                            <span>{selectedAnswers.filter(a => a !== null).length} answered</span>
                          </div>
                          <div className="w-full bg-base-200 rounded-full h-2">
                            <div
                              className="bg-secondary h-2 rounded-full transition-all"
                              style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">
                            {quizData.questions[currentQuestion].question}
                          </h3>
                          <div className="space-y-3">
                            {quizData.questions[currentQuestion].options.map((option, idx) => (
                              <button
                                key={idx}
                                onClick={() => selectAnswer(idx)}
                                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                                  selectedAnswers[currentQuestion] === idx
                                    ? "border-secondary bg-secondary/10"
                                    : "border-base-300 hover:border-secondary/50"
                                }`}
                              >
                                <span className="font-medium mr-3">{String.fromCharCode(65 + idx)}.</span>
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>

                        {submitError && (
                          <p className="text-error text-sm mb-4 text-center">{submitError}</p>
                        )}

                        <div className="flex justify-between">
                          <button
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-base-200 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                            Previous
                          </button>

                          {currentQuestion === quizData.questions.length - 1 ? (
                            <button
                              onClick={submitQuiz}
                              disabled={selectedAnswers.some(a => a === null) || submitting}
                              className="px-6 py-2 bg-secondary text-secondary-content rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/90 transition-colors"
                            >
                              {submitting ? "Saving..." : "Submit Quiz"}
                            </button>
                          ) : (
                            <button
                              onClick={() => setCurrentQuestion(Math.min(quizData.questions.length - 1, currentQuestion + 1))}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-base-200 transition-colors"
                            >
                              Next
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-base-200">
                          {quizData.questions.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentQuestion(idx)}
                              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                idx === currentQuestion
                                  ? "bg-secondary text-secondary-content"
                                  : selectedAnswers[idx] !== null
                                  ? "bg-secondary/20 text-secondary"
                                  : "bg-base-200 text-base-content/60"
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Results after submitting this session */}
                    {quizSubmitted && !priorSubmission && (
                      <div>
                        <div className="text-center py-6 mb-6 border-b border-base-200">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            getScore().percentage >= 70 ? "bg-success/10" : "bg-error/10"
                          }`}>
                            <span className={`text-3xl font-bold ${
                              getScore().percentage >= 70 ? "text-success" : "text-error"
                            }`}>
                              {getScore().percentage}%
                            </span>
                          </div>
                          <p className="text-lg font-semibold">
                            {getScore().correct} out of {getScore().total} correct
                          </p>
                          <p className="text-sm text-success mt-1">Score saved</p>
                          {attemptsUsed < maxAttempts ? (
                            <button
                              onClick={retakeQuiz}
                              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Try Again ({maxAttempts - attemptsUsed} {maxAttempts - attemptsUsed === 1 ? "attempt" : "attempts"} left)
                            </button>
                          ) : (
                            <p className="mt-2 text-xs text-base-content/40">
                              {maxAttempts > 1 ? "No attempts remaining." : ""}
                            </p>
                          )}
                        </div>

                        <h3 className="font-semibold mb-4">Review Answers</h3>
                        <div className="space-y-4">
                          {quizData.questions.map((q, idx) => {
                            const isCorrect = selectedAnswers[idx] === q.correctIndex;
                            return (
                              <div key={idx} className={`p-4 rounded-xl border-2 ${
                                isCorrect ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
                              }`}>
                                <div className="flex items-start gap-3">
                                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                                    isCorrect ? "bg-success text-success-content" : "bg-error text-error-content"
                                  }`}>
                                    {isCorrect ? "✓" : "✗"}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium mb-2">{q.question}</p>
                                    <p className="text-sm">
                                      <span className="text-base-content/60">Your answer: </span>
                                      <span className={isCorrect ? "text-success" : "text-error"}>
                                        {selectedAnswers[idx] !== null ? q.options[selectedAnswers[idx]!] : "No answer"}
                                      </span>
                                    </p>
                                    {!isCorrect && (
                                      <p className="text-sm mt-1">
                                        <span className="text-base-content/60">Correct answer: </span>
                                        <span className="text-success">{q.options[q.correctIndex]}</span>
                                      </p>
                                    )}
                                    {q.explanation && (
                                      <p className="text-sm mt-2 text-base-content/70 italic">{q.explanation}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-base-200">
                      <div className="flex items-center gap-2 text-sm text-base-content/60">
                        <Calendar className="w-4 h-4" />
                        {viewingAssignment.due_date
                          ? new Date(viewingAssignment.due_date).toLocaleDateString("en-US", {
                              weekday: "long", year: "numeric", month: "long", day: "numeric",
                            })
                          : "No due date"}
                      </div>
                      <div className="text-sm font-medium">{viewingAssignment.points_possible} points</div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{viewingAssignment.description || "No description provided."}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
