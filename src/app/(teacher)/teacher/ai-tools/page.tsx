"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Brain,
  ListChecks,
  Wand2,
  Send,
  Loader2,
  Copy,
  Check,
  Sparkles,
  History,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";

const tools = [
  {
    id: "lesson-plan",
    icon: FileText,
    label: "Lesson Plan Generator",
    description: "Create engaging lesson plans for any topic",
    placeholder: "Create a 45-minute lesson plan on photosynthesis for 6th graders",
  },
  {
    id: "quiz",
    icon: Brain,
    label: "Quiz Builder",
    description: "Generate quizzes and assessments",
    placeholder: "Create a 10-question quiz on the American Revolution for 8th grade",
  },
  {
    id: "differentiation",
    icon: ListChecks,
    label: "Differentiation Tool",
    description: "Adapt content for diverse learners",
    placeholder: "Differentiate this reading passage for below, on, and above grade level readers",
  },
  {
    id: "rubric",
    icon: Wand2,
    label: "Rubric Maker",
    description: "Create grading rubrics instantly",
    placeholder: "Create a 4-point rubric for a persuasive essay assignment",
  },
];

export default function AIToolsPage() {
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState(searchParams.get("tool") || "lesson-plan");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const toolParam = searchParams.get("tool");
    if (toolParam && tools.some((t) => t.id === toolParam)) {
      setActiveTool(toolParam);
    }
  }, [searchParams]);

  const activeToolData = tools.find((t) => t.id === activeTool)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          tool: activeTool,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setResponse(`Error: ${data.error}`);
      } else {
        setResponse(data.response);
      }
    } catch (error) {
      setResponse("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-base-content flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Teaching Tools
        </h1>
        <p className="text-base-content/60">
          Powered by Claude AI to help you create amazing educational content
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm">Select Tool</h3>
            </CardHeader>
            <CardContent className="p-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setResponse("");
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    activeTool === tool.id
                      ? "bg-primary text-primary-content"
                      : "hover:bg-base-200"
                  }`}
                >
                  <tool.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tool.label}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Generations
              </h3>
            </CardHeader>
            <CardContent className="p-2">
              <p className="text-xs text-base-content/50 text-center py-4">
                Your recent AI generations will appear here
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <activeToolData.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-base-content">
                    {activeToolData.label}
                  </h2>
                  <p className="text-sm text-base-content/60">
                    {activeToolData.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-base-content mb-2">
                    What would you like to create?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={activeToolData.placeholder}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  disabled={!prompt.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <AnimatePresence>
            {(response || isLoading) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="font-semibold">Generated Content</h3>
                    {response && (
                      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-3 text-base-content/60">
                          Generating your content...
                        </span>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{response}</ReactMarkdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
