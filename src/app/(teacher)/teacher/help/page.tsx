"use client";

import { useState } from "react";
import {
  HelpCircle,
  Book,
  MessageCircle,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const faqs = [
  {
    question: "How do I create a new class?",
    answer: "Navigate to 'My Classes' in the sidebar and click the 'Create Class' button. Fill in the class name, subject, period, and other details. Once created, you can add students and assignments.",
  },
  {
    question: "How do I add students to my class?",
    answer: "Go to your class page and click 'Add Student'. You can add students by email or share the class code with them so they can join directly.",
  },
  {
    question: "How do I create assignments?",
    answer: "Go to the Assignments page and click 'Create Assignment'. Select the class, set the due date, point value, and add instructions. You can also use AI tools to help generate quizzes and content.",
  },
  {
    question: "How do I use the AI tools?",
    answer: "Access AI Tools from the sidebar. Choose from Lesson Plan Generator, Quiz Builder, Differentiation Tool, or Rubric Maker. Enter your topic and requirements, and the AI will generate content you can use or modify.",
  },
  {
    question: "How do I grade assignments?",
    answer: "Go to the Gradebook page, select a class, and you'll see all students and assignments. Click on any cell to enter or edit grades. Changes save automatically.",
  },
  {
    question: "Can students retake quizzes?",
    answer: "By default, quizzes can only be submitted once to maintain academic integrity. If you need to allow a retake, you can reset a student's submission from the assignment details page.",
  },
];

const resources = [
  {
    icon: Book,
    title: "Getting Started Guide",
    description: "Learn the basics of GradeBridge",
    href: "#",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Watch step-by-step tutorials",
    href: "#",
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Detailed feature documentation",
    href: "#",
  },
  {
    icon: Sparkles,
    title: "AI Tools Guide",
    description: "Get the most out of AI features",
    href: "#",
  },
];

export default function TeacherHelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-base-content">Help & Support</h1>
        <p className="text-base-content/60">Find answers and get assistance</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Frequently Asked Questions
              </h2>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-base-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-base-200 transition-colors"
                    >
                      <span className="font-medium text-base-content">{faq.question}</span>
                      {openFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-base-content/50" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-base-content/50" />
                      )}
                    </button>
                    {openFaq === index && (
                      <div className="px-4 pb-4 text-base-content/70">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold flex items-center gap-2">
                <Book className="w-5 h-5 text-secondary" />
                Resources
              </h2>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {resources.map((resource) => (
                  <a
                    key={resource.title}
                    href={resource.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center group-hover:bg-base-300 transition-colors">
                      <resource.icon className="w-5 h-5 text-base-content/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base-content text-sm">{resource.title}</p>
                      <p className="text-xs text-base-content/60">{resource.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-base-content/40" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-base-content">Need More Help?</h3>
                <p className="text-sm text-base-content/70 mt-1 mb-4">
                  Our support team is here to assist you
                </p>
                <Button variant="primary" size="sm" className="w-full justify-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
