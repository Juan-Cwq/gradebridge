"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Database,
  FileText,
  Users,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncItem {
  id: string;
  name: string;
  type: "assignment" | "rubric" | "grades" | "feedback";
  source: string;
  studentCount?: number;
  selected: boolean;
}

const mockSyncItems: SyncItem[] = [
  {
    id: "1",
    name: "Historical Fiction Essay",
    type: "assignment",
    source: "MagicSchool AI",
    studentCount: 28,
    selected: true,
  },
  {
    id: "2",
    name: "Essay Rubric - 4 Point Scale",
    type: "rubric",
    source: "MagicSchool AI",
    selected: true,
  },
  {
    id: "3",
    name: "Week 9 Vocabulary Quiz",
    type: "assignment",
    source: "MagicSchool AI",
    studentCount: 28,
    selected: true,
  },
  {
    id: "4",
    name: "Poetry Analysis Feedback",
    type: "feedback",
    source: "MagicSchool AI",
    studentCount: 24,
    selected: false,
  },
];

const typeIcons = {
  assignment: FileText,
  rubric: Sparkles,
  grades: Database,
  feedback: Users,
};

const typeColors = {
  assignment: "bg-brand-innovation/10 text-brand-innovation",
  rubric: "bg-warning/10 text-warning",
  grades: "bg-success/10 text-success",
  feedback: "bg-brand-trust/10 text-brand-trust",
};

export default function SyncHubPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [items, setItems] = useState<SyncItem[]>(mockSyncItems);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const selectedCount = items.filter((item) => item.selected).length;

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSync = async () => {
    if (selectedCount === 0) return;

    setSyncStatus("syncing");
    setSyncProgress(0);

    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    await new Promise((resolve) => setTimeout(resolve, 2500));
    clearInterval(progressInterval);
    setSyncProgress(100);

    await new Promise((resolve) => setTimeout(resolve, 500));
    setSyncStatus("success");

    setTimeout(() => {
      setSyncStatus("idle");
      setSyncProgress(0);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display text-base-content">
          Sync Hub
        </h1>
        <p className="text-base-content/60 mt-1">
          Select items from MagicSchool AI to sync to GradeLink.
        </p>
      </div>

      {/* Main Sync Card */}
      <Card variant="elevated" animate={false}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-base-content">
                  Ready to Sync
                </h2>
                <p className="text-sm text-base-content/60">
                  {selectedCount} items selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm text-base-content/60 hover:text-base-content transition-colors"
            >
              Details
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  showDetails && "rotate-180"
                )}
              />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sync Button */}
          <div className="flex flex-col items-center py-8">
            <AnimatePresence mode="wait">
              {syncStatus === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <Button
                    variant="sync"
                    size="lg"
                    onClick={handleSync}
                    disabled={selectedCount === 0}
                    className="text-xl px-12 py-6"
                    rightIcon={<ArrowRight className="w-6 h-6" />}
                  >
                    Sync to GradeLink
                  </Button>
                </motion.div>
              )}

              {syncStatus === "syncing" && (
                <motion.div
                  key="syncing"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-base-300" />
                    <svg
                      className="absolute top-0 left-0 w-24 h-24 -rotate-90"
                      viewBox="0 0 96 96"
                    >
                      <circle
                        cx="48"
                        cy="48"
                        r="44"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${syncProgress * 2.76} 276`}
                        className="transition-all duration-200"
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-brand-innovation animate-spin" />
                    </div>
                  </div>
                  <p className="text-base-content font-medium">
                    Syncing {selectedCount} items...
                  </p>
                </motion.div>
              )}

              {syncStatus === "success" && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center"
                  >
                    <CheckCircle className="w-12 h-12 text-success" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-success">
                      Sync Complete!
                    </p>
                    <p className="text-base-content/60 mt-1">
                      {selectedCount} items synced to GradeLink
                    </p>
                  </div>
                </motion.div>
              )}

              {syncStatus === "error" && (
                <motion.div
                  key="error"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-error" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-error">
                      Sync Failed
                    </p>
                    <p className="text-base-content/60 mt-1">
                      Please check your connection and try again
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setSyncStatus("idle")}>
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Flow Visualization */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-purple-600">MagicSchool AI</span>
            </div>
            <ArrowRight className="w-5 h-5 text-base-content/40" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center">
              <RefreshCw
                className={cn(
                  "w-5 h-5 text-white",
                  syncStatus === "syncing" && "animate-spin"
                )}
              />
            </div>
            <ArrowRight className="w-5 h-5 text-base-content/40" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10">
              <Database className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-600">GradeLink</span>
            </div>
          </div>

          {/* Items List */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-base-300/50 pt-6">
                  <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-4">
                    Items to Sync
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const Icon = typeIcons[item.type];
                      return (
                        <label
                          key={item.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                            item.selected
                              ? "border-primary/30 bg-primary/5"
                              : "border-base-300/50 hover:bg-base-200/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleItem(item.id)}
                            className="checkbox checkbox-primary"
                          />
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              typeColors[item.type]
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-base-content">
                              {item.name}
                            </p>
                            <p className="text-sm text-base-content/60">
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                              {item.studentCount && ` • ${item.studentCount} students`}
                            </p>
                          </div>
                          <span className="text-xs text-base-content/40">
                            {item.source}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card variant="bento">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-base-content mb-1">Pro Tip</h3>
            <p className="text-sm text-base-content/60">
              You can trigger syncs directly from MagicSchool AI using our browser
              extension. Install it from the settings page to save even more time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
