"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createBrowserClient } from "@supabase/ssr";

type Assignment = {
  id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  points_possible: number;
  category?: string;
  class: {
    id: string;
    name: string;
    color: string | null;
  } | null;
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

function parseQuizData(description: string | null): QuizData | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed as QuizData;
    }
  } catch {
    // Not JSON format - try legacy text parsing
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
        currentQuestion = {
          question: questionMatch[2],
          options: [],
          correctIndex: 0,
        };
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
      return {
        title: titleMatch ? titleMatch[1] : 'Quiz',
        questions,
      };
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
  
  // Quiz/Assignment viewing state
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

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
          category,
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

  const openAssignment = (assignment: Assignment) => {
    setViewingAssignment(assignment);
    const parsed = parseQuizData(assignment.description);
    setQuizData(parsed);
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswers(parsed ? new Array(parsed.questions.length).fill(null) : []);
    setQuizSubmitted(false);
  };

  const closeAssignment = () => {
    setViewingAssignment(null);
    setQuizData(null);
    setQuizStarted(false);
    setQuizSubmitted(false);
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

  const submitQuiz = () => {
    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswers(quizData ? new Array(quizData.questions.length).fill(null) : []);
    setQuizSubmitted(false);
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
                        <h3 className="font-medium text-base-content truncate">
                          {assignment.name}
                        </h3>
                        {assignment.category === "quiz" && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                            Quiz
                          </span>
                        )}
                      </div>
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
              className="bg-base-100 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-base-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-base-content">{viewingAssignment.name}</h2>
                  <p className="text-sm text-base-content/60">{viewingAssignment.class?.name}</p>
                </div>
                <button
                  onClick={closeAssignment}
                  className="p-2 hover:bg-base-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                {quizData ? (
                  <>
                    {!quizStarted && !quizSubmitted && (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Play className="w-10 h-10 text-secondary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{quizData.title || "Quiz"}</h3>
                        <p className="text-base-content/60 mb-6">
                          {quizData.questions.length} questions • {viewingAssignment.points_possible} points
                        </p>
                        <button
                          onClick={startQuiz}
                          className="px-8 py-3 bg-secondary text-secondary-content rounded-xl font-semibold hover:bg-secondary/90 transition-colors"
                        >
                          Start Quiz
                        </button>
                      </div>
                    )}

                    {quizStarted && !quizSubmitted && (
                      <div>
                        {/* Progress */}
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

                        {/* Question */}
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

                        {/* Navigation */}
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
                              disabled={selectedAnswers.some(a => a === null)}
                              className="px-6 py-2 bg-secondary text-secondary-content rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/90 transition-colors"
                            >
                              Submit Quiz
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

                        {/* Question dots */}
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

                    {quizSubmitted && (
                      <div>
                        {/* Score */}
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
                          <button
                            onClick={resetQuiz}
                            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Try Again
                          </button>
                        </div>

                        {/* Review */}
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
                                        {selectedAnswers[idx] !== null ? q.options[selectedAnswers[idx]] : "No answer"}
                                      </span>
                                    </p>
                                    {!isCorrect && (
                                      <p className="text-sm mt-1">
                                        <span className="text-base-content/60">Correct answer: </span>
                                        <span className="text-success">{q.options[q.correctIndex]}</span>
                                      </p>
                                    )}
                                    {q.explanation && (
                                      <p className="text-sm mt-2 text-base-content/70 italic">
                                        {q.explanation}
                                      </p>
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
                  /* Regular assignment view */
                  <div>
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-base-200">
                      <div className="flex items-center gap-2 text-sm text-base-content/60">
                        <Calendar className="w-4 h-4" />
                        {viewingAssignment.due_date
                          ? new Date(viewingAssignment.due_date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "No due date"}
                      </div>
                      <div className="text-sm font-medium">
                        {viewingAssignment.points_possible} points
                      </div>
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
