"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Bell,
  Shield,
  Trash2,
  LogOut,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signOut, deleteAccount, switchRole } from "@/lib/auth/actions";
import { createBrowserClient } from "@supabase/ssr";

export default function TeacherSettingsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") return;
    
    startTransition(async () => {
      await deleteAccount();
    });
  };

  const handleSwitchToStudent = () => {
    startTransition(async () => {
      await switchRole("student");
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-base-content">Settings</h1>
        <p className="text-base-content/60">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Switch View
          </h2>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-base-content/70 mb-4">
            Switch between teacher and student views to see both dashboards.
          </p>
          
          <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Currently viewing as Teacher</p>
              <p className="text-sm text-base-content/60">You have access to class management and grading tools</p>
            </div>
          </div>

          {!showSwitchConfirm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowSwitchConfirm(true)}
              className="w-full"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Switch to Student View
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <p className="text-sm text-base-content/70">
                Switch to student view? You can always switch back.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowSwitchConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleSwitchToStudent}
                  isLoading={isPending}
                  className="flex-1"
                >
                  Switch to Student
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Session
          </h2>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-base-content/70 mb-4">
            Sign out of your account on this device.
          </p>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            isLoading={isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-error/20">
        <CardHeader>
          <h2 className="font-semibold flex items-center gap-2 text-error">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h2>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-base-content/70 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          
          {!showDeleteConfirm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(true)}
              className="border-error/50 text-error hover:bg-error/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 p-4 bg-error/5 rounded-lg border border-error/20"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-error">This will permanently delete:</p>
                  <ul className="text-sm text-base-content/70 mt-2 space-y-1 list-disc list-inside">
                    <li>Your profile and account data</li>
                    <li>All classes you&apos;ve created</li>
                    <li>All student records and grades</li>
                    <li>All AI-generated content</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2 rounded-lg border border-error/30 bg-base-100 focus:outline-none focus:ring-2 focus:ring-error"
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE"}
                  isLoading={isPending}
                  className="flex-1 bg-error hover:bg-error/90 border-error"
                >
                  Delete My Account
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
