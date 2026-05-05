"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Book,
  MessageCircle,
  ChevronDown,
  ExternalLink,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How does GradeBridge connect to MagicSchool AI?",
    answer:
      "GradeBridge uses OAuth authentication to securely connect to your MagicSchool AI account. Once connected, we can read your assignments, rubrics, and feedback to sync them to GradeLink. Your credentials are never stored on our servers.",
  },
  {
    question: "Is my student data safe?",
    answer:
      "Absolutely. GradeBridge is FERPA-compliant and uses bank-level encryption (AES-256) for all data in transit and at rest. We never store student data permanently—it's only processed during the sync and then immediately discarded.",
  },
  {
    question: "Can I choose which items to sync?",
    answer:
      "Yes! In the Sync Hub, you can select exactly which assignments, rubrics, grades, or feedback to sync. You have full control over what gets transferred to GradeLink.",
  },
  {
    question: "What happens if a sync fails?",
    answer:
      "If a sync fails, you'll receive a detailed error message explaining what went wrong. Common issues include expired authentication tokens (easily fixed by reconnecting) or temporary network issues. You can retry any failed sync at any time.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel your subscription at any time from Settings > Billing. Your access will continue until the end of your current billing period. We don't believe in lock-in—your data is always yours.",
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display text-base-content">
          Help & Support
        </h1>
        <p className="text-base-content/60 mt-1">
          Get answers to common questions or reach out for support.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: Book,
            title: "Documentation",
            description: "Detailed guides and tutorials",
            href: "#",
          },
          {
            icon: MessageCircle,
            title: "Live Chat",
            description: "Chat with our support team",
            href: "#",
          },
          {
            icon: Mail,
            title: "Email Support",
            description: "support@gradebridge.io",
            href: "mailto:support@gradebridge.io",
          },
        ].map((item) => (
          <a key={item.title} href={item.href}>
            <Card
              variant="elevated"
              animate={false}
              className="p-4 hover:border-primary/30 transition-colors h-full"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-base-content">{item.title}</h3>
                  <p className="text-sm text-base-content/60">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>

      {/* FAQs */}
      <section>
        <h2 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Frequently Asked Questions
        </h2>
        <Card variant="elevated" animate={false}>
          <div className="divide-y divide-base-300/50">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-base-200/50 transition-colors"
                >
                  <span className="font-medium text-base-content pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-base-content/40 flex-shrink-0 transition-transform",
                      openFaq === index && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 text-base-content/70">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Contact Form */}
      <section>
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Still Need Help?
        </h2>
        <Card variant="elevated" animate={false}>
          <CardContent className="p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-base-content mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-4 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="primary">Send Message</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* External Resources */}
      <section>
        <h2 className="text-lg font-semibold text-base-content mb-4">
          External Resources
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "MagicSchool AI Help Center",
              href: "https://help.magicschool.ai",
            },
            {
              title: "GradeLink Support",
              href: "https://support.gradelink.com",
            },
          ].map((resource) => (
            <a
              key={resource.title}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-lg border border-base-300/50 hover:border-primary/30 hover:bg-base-200/50 transition-colors"
            >
              <span className="text-base-content">{resource.title}</span>
              <ExternalLink className="w-4 h-4 text-base-content/40" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
