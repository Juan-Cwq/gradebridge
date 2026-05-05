"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function NumberTicker({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {displayValue.toFixed(1)}
      {suffix}
    </span>
  );
}

export default function DashboardPage() {
  const [syncing, setSyncing] = useState(false);

  const handleQuickSync = async () => {
    setSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSyncing(false);
  };

  const recentSyncs = [
    {
      id: 1,
      name: "Historical Fiction Essay Rubric",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: "success",
      itemsCount: 24,
    },
    {
      id: 2,
      name: "Week 8 Vocabulary Quiz",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: "success",
      itemsCount: 32,
    },
    {
      id: 3,
      name: "Poetry Analysis Assignment",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: "success",
      itemsCount: 28,
    },
  ];

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display text-base-content">
            Welcome back, Sarah
          </h1>
          <p className="text-base-content/60 mt-1">
            Here&apos;s your sync status at a glance.
          </p>
        </div>
        <Link href="/dashboard/sync">
          <Button
            variant="sync"
            leftIcon={<RefreshCw className="w-5 h-5" />}
            isLoading={syncing}
            onClick={handleQuickSync}
          >
            Quick Sync
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" animate={false} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-base-content/60 mb-1">Hours Saved This Month</p>
                <p className="text-3xl font-bold text-base-content">
                  <NumberTicker value={12.5} suffix="h" />
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-success">
              <TrendingUp className="w-4 h-4" />
              <span>+2.3h from last month</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated" animate={false} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-base-content/60 mb-1">Syncs This Month</p>
                <p className="text-3xl font-bold text-base-content">47</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-innovation/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-brand-innovation" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-base-content/60">
              <span>All successful</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated" animate={false} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-base-content/60 mb-1">Items Transferred</p>
                <p className="text-3xl font-bold text-base-content">1,284</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-trust/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-trust" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-base-content/60">
              <span>Grades, rubrics & assignments</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated" animate={false} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-base-content/60 mb-1">Connection Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="status-dot connected" />
                  <span className="font-medium text-base-content">All Connected</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-base-content/60">
              <span>MagicSchool AI</span>
              <span>•</span>
              <span>GradeLink</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Syncs */}
        <div className="lg:col-span-2">
          <Card variant="elevated" animate={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-base-content">
                  Recent Syncs
                </h2>
                <Link
                  href="/dashboard/sync"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-base-300/50">
                {recentSyncs.map((sync) => (
                  <div
                    key={sync.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-base-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          sync.status === "success"
                            ? "bg-success/10"
                            : "bg-error/10"
                        }`}
                      >
                        {sync.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-error" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-base-content">
                          {sync.name}
                        </p>
                        <p className="text-sm text-base-content/60">
                          {sync.itemsCount} items • {formatTimestamp(sync.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-success capitalize">
                      {sync.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status */}
        <div>
          <Card variant="elevated" animate={false}>
            <CardHeader>
              <h2 className="text-lg font-semibold text-base-content">
                Integrations
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: "MagicSchool AI",
                  status: "connected",
                  color: "bg-purple-500",
                },
                {
                  name: "GradeLink SIS",
                  status: "connected",
                  color: "bg-blue-500",
                },
                {
                  name: "Google OAuth",
                  status: "connected",
                  color: "bg-red-500",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-base-200/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${integration.color} flex items-center justify-center`}
                    >
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-base-content">
                      {integration.name}
                    </span>
                  </div>
                  <span
                    className={`status-dot ${integration.status === "connected" ? "connected" : "disconnected"}`}
                  />
                </div>
              ))}

              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-center mt-2">
                  Manage Integrations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
