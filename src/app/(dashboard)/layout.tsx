"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  LayoutDashboard,
  RefreshCw,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Menu,
  BookOpen,
  Users,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/dashboard/classes",
    icon: BookOpen,
    label: "Classes",
  },
  {
    href: "/dashboard/students",
    icon: Users,
    label: "Students",
  },
  {
    href: "/dashboard/gradebook",
    icon: GraduationCap,
    label: "Gradebook",
  },
  {
    href: "/dashboard/sync",
    icon: RefreshCw,
    label: "Sync Hub",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
  },
  {
    href: "/dashboard/help",
    icon: HelpCircle,
    label: "Help",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-base-100 border-b border-base-300 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg">GradeBridge</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-base-200"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-base-100 border-r border-base-300 transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-base-300">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-display text-xl">GradeBridge</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-base-300 space-y-1">
            <button
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full",
                "text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>

            {/* Collapse Toggle (Desktop only) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-base-content/50 hover:bg-base-200 hover:text-base-content transition-colors"
            >
              <ChevronLeft
                className={cn(
                  "w-5 h-5 transition-transform",
                  sidebarCollapsed && "rotate-180"
                )}
              />
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
