"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Loader2,
  Lightbulb,
  FileQuestion,
  BookMarked,
  User,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import { createBrowserClient } from "@supabase/ssr";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const modes = [
  {
    id: "explain",
    icon: Lightbulb,
    label: "Explain a Concept",
    description: "Get clear explanations of any topic",
    suggestedPrompts: [
      "Explain photosynthesis in simple terms",
      "What is the Pythagorean theorem?",
      "How does the water cycle work?",
    ],
  },
  {
    id: "quiz",
    icon: FileQuestion,
    label: "Practice Quiz",
    description: "Test your knowledge with practice questions",
    suggestedPrompts: [
      "Quiz me on the American Revolution",
      "Give me 5 math problems about fractions",
      "Test my vocabulary with a short quiz",
    ],
  },
  {
    id: "study",
    icon: BookMarked,
    label: "Study Help",
    description: "Get tips and strategies for studying",
    suggestedPrompts: [
      "How should I study for a history test?",
      "Help me create a study schedule",
      "What are good ways to memorize vocabulary?",
    ],
  },
];

export default function AITutorPage() {
  const searchParams = useSearchParams();
  const [activeMode, setActiveMode] = useState(searchParams.get("mode") || "explain");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [classContext, setClassContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchClassContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          class:classes(name, subject)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (enrollments) {
        const classes = enrollments
          .map((e) => {
            const cls = e.class as { name: string; subject: string | null } | null;
            return cls ? `${cls.name}${cls.subject ? ` (${cls.subject})` : ""}` : null;
          })
          .filter(Boolean);
        setClassContext(`Enrolled classes: ${classes.join(", ")}`);
      }
    };

    fetchClassContext();
  }, [supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeModeData = modes.find((m) => m.id === activeMode)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          tool: "tutor",
          context: classContext,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `I'm sorry, I encountered an error. Please try again.` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-base-content flex items-center gap-2">
          <Bot className="w-6 h-6 text-secondary" />
          AI Tutor
        </h1>
        <p className="text-base-content/60">
          Your personal AI learning assistant
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm">Learning Mode</h3>
            </CardHeader>
            <CardContent className="p-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    activeMode === mode.id
                      ? "bg-secondary text-secondary-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <mode.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{mode.label}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm">Try asking...</h3>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              {activeModeData.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="w-full text-left p-2 rounded-lg hover:bg-base-200 transition-colors text-sm text-base-content/70"
                >
                  &quot;{prompt}&quot;
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <activeModeData.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 className="font-semibold text-base-content">
                    {activeModeData.label}
                  </h2>
                  <p className="text-sm text-base-content/60">
                    {activeModeData.description}
                  </p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearChat}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-base-content mb-2">
                    How can I help you learn today?
                  </h3>
                  <p className="text-sm text-base-content/60 max-w-sm">
                    Ask me anything! I can explain concepts, create practice quizzes, or help you study.
                  </p>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : ""
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-secondary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-secondary text-secondary-content"
                              : "bg-base-200"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="bg-base-200 rounded-2xl px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-base-300">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
