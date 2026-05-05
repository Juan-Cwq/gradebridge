"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  FileText,
  Sparkles,
  MessageSquare,
  Megaphone,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Zap,
  ArrowRightLeft,
} from "lucide-react";
import { signOut, switchRole } from "@/lib/auth/actions";
import type { Tables } from "@/lib/database.types";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/teacher" },
  { icon: BookOpen, label: "My Classes", href: "/teacher/classes" },
  { icon: Users, label: "Students", href: "/teacher/students" },
  { icon: FileText, label: "Assignments", href: "/teacher/assignments" },
  { icon: ClipboardList, label: "Gradebook", href: "/teacher/gradebook" },
  { icon: Megaphone, label: "Announcements", href: "/teacher/announcements" },
  { icon: MessageSquare, label: "Messages", href: "/teacher/messages" },
  { icon: Sparkles, label: "AI Tools", href: "/teacher/ai-tools" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", href: "/teacher/settings" },
  { icon: HelpCircle, label: "Help", href: "/teacher/help" },
];

type Profile = Tables<"profiles">;

export default function TeacherSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "T";

  const SidebarContent = () => (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-base-300">
        <Link href="/teacher" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-base-content">
            GradeBridge
          </span>
        </Link>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/teacher" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-primary-content"
                  : "text-base-content/70 hover:bg-base-300 hover:text-base-content"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-base-300 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-primary-content"
                  : "text-base-content/70 hover:bg-base-300 hover:text-base-content"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        <form action={() => switchRole("student")}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base-content/70 hover:bg-secondary/10 hover:text-secondary transition-all"
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span className="font-medium">Switch to Student</span>
          </button>
        </form>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base-content/70 hover:bg-error/10 hover:text-error transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </form>
      </div>

      <div className="p-4 border-t border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-base-content truncate">
              {profile.full_name || "Teacher"}
            </p>
            <p className="text-xs text-base-content/50 truncate">
              {profile.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-base-100 border-r border-base-300">
        <SidebarContent />
      </aside>

      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-base-100 border border-base-300 shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-base-100 border-r border-base-300"
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-base-200"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
