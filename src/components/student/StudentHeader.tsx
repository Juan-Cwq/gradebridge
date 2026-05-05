"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import type { Tables } from "@/lib/database.types";

type Profile = Tables<"profiles">;

export default function StudentHeader({ profile }: { profile: Profile }) {
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dueThisWeek, setDueThisWeek] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("class_id")
        .eq("user_id", profile.id)
        .eq("is_active", true);

      if (enrollments && enrollments.length > 0) {
        const classIds = enrollments.map((e) => e.class_id);
        
        const { count } = await supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds)
          .eq("is_published", true)
          .gte("due_date", new Date().toISOString())
          .lte("due_date", oneWeekFromNow.toISOString());

        setDueThisWeek(count || 0);
      }

      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      setNotifications(notifs || []);
    };

    fetchData();

    const channel = supabase
      .channel("student-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Tables<"notifications">, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id, supabase]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "S";

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-base-100/80 backdrop-blur-lg border-b border-base-300">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4 pl-12 lg:pl-0">
          <div className="hidden sm:flex w-10 h-10 rounded-full bg-secondary/20 items-center justify-center text-secondary font-semibold">
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
          <div>
            <h1 className="text-lg font-semibold text-base-content">
              {greeting()}, {profile.full_name?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-sm text-base-content/60">{currentDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-base-content/70">
            {dueThisWeek > 0 && (
              <span className="px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                {dueThisWeek} due this week
              </span>
            )}
            <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
              Student
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-base-200 transition-colors"
            >
              <Bell className="w-5 h-5 text-base-content/70" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 w-80 bg-base-100 rounded-xl border border-base-300 shadow-lg overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-base-300 flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={async () => {
                          await supabase
                            .from("notifications")
                            .update({ is_read: true })
                            .eq("user_id", profile.id);
                          setNotifications([]);
                        }}
                        className="text-xs text-secondary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-base-content/50 text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <a
                          key={notif.id}
                          href={notif.link || "#"}
                          onClick={async () => {
                            await supabase
                              .from("notifications")
                              .update({ is_read: true })
                              .eq("id", notif.id);
                            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                          }}
                          className="block p-3 border-b border-base-200 hover:bg-base-100 transition-colors cursor-pointer"
                        >
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-base-content/60">{notif.message}</p>
                          <p className="text-xs text-base-content/40 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </a>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
