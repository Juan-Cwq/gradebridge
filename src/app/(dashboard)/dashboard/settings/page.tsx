"use client";

import { useState } from "react";
import {
  Zap,
  Shield,
  Bell,
  User,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  color: string;
  lastSync?: Date;
}

const integrations: Integration[] = [
  {
    id: "magicschool",
    name: "MagicSchool AI",
    description: "AI-powered lesson planning and content generation",
    connected: true,
    color: "bg-purple-500",
    lastSync: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "gradelink",
    name: "GradeLink SIS",
    description: "Student Information System and gradebook",
    connected: true,
    color: "bg-blue-500",
    lastSync: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "google",
    name: "Google Workspace",
    description: "Single sign-on and Google Drive integration",
    connected: true,
    color: "bg-red-500",
  },
];

const settingsSections = [
  {
    id: "profile",
    icon: User,
    title: "Profile Settings",
    description: "Manage your account details and preferences",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Configure email and in-app notifications",
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    description: "Password, two-factor authentication, and sessions",
  },
];

export default function SettingsPage() {
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  const formatLastSync = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    return `${diffHours} hours ago`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display text-base-content">
          Settings
        </h1>
        <p className="text-base-content/60 mt-1">
          Manage your integrations and account preferences.
        </p>
      </div>

      {/* Integrations */}
      <section>
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Connected Integrations
        </h2>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card
              key={integration.id}
              variant="elevated"
              animate={false}
              className={cn(
                "cursor-pointer transition-all",
                activeIntegration === integration.id && "ring-2 ring-primary"
              )}
            >
              <CardContent
                className="p-4"
                onClick={() =>
                  setActiveIntegration(
                    activeIntegration === integration.id ? null : integration.id
                  )
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      integration.color
                    )}
                  >
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base-content">
                        {integration.name}
                      </h3>
                      {integration.connected ? (
                        <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-error bg-error/10 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-base-content/60">
                      {integration.description}
                    </p>
                    {integration.lastSync && (
                      <p className="text-xs text-base-content/40 mt-1">
                        Last synced: {formatLastSync(integration.lastSync)}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-base-content/40 transition-transform",
                      activeIntegration === integration.id && "rotate-90"
                    )}
                  />
                </div>

                {activeIntegration === integration.id && (
                  <div className="mt-4 pt-4 border-t border-base-300/50 flex gap-3">
                    <Button variant="outline" size="sm">
                      Reconnect
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error hover:bg-error/10"
                    >
                      Disconnect
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ExternalLink className="w-4 h-4" />}
                    >
                      View Docs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="mt-4">
          + Add Integration
        </Button>
      </section>

      {/* Other Settings */}
      <section>
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Account Settings
        </h2>
        <Card variant="elevated" animate={false}>
          <div className="divide-y divide-base-300/50">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                className="w-full flex items-center gap-4 p-4 hover:bg-base-200/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-base-content/70" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-base-content">
                    {section.title}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {section.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-base-content/40" />
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-lg font-semibold text-error mb-4">Danger Zone</h2>
        <Card variant="elevated" animate={false} className="border-error/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base-content">
                  Delete Account
                </h3>
                <p className="text-sm text-base-content/60">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-error hover:bg-error/10"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
