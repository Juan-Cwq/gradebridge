"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  ClipboardList,
  MessageSquare,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";

type EnrolledClass = {
  id: string;
  class: {
    id: string;
    name: string;
    color: string | null;
    period: string | null;
    subject: string | null;
    teacher: { id: string; full_name: string | null } | null;
  } | null;
};

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchClasses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("enrollments")
        .select(`
          id,
          class:classes(
            id,
            name,
            color,
            period,
            subject,
            teacher:profiles(id, full_name)
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      setClasses(data || []);
      setLoading(false);
    };

    fetchClasses();
  }, [supabase]);

  const classColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];

  const getClassColor = (color: string | null, index: number) =>
    color ? `bg-[${color}]` : classColors[index % classColors.length];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-base-content">My Classes</h1>
          <p className="text-base-content/60">View your enrolled classes and communicate with teachers</p>
        </div>
        <Link href="/student/join-class">
          <Button variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Join a Class
          </Button>
        </Link>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold text-base-content mb-2">No classes yet</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Join a class using a code from your teacher
            </p>
            <Link href="/student/join-class">
              <Button variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Join a Class
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((enrollment, index) => {
            if (!enrollment.class) return null;
            const cls = enrollment.class;

            return (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div
                      className={`h-2 rounded-t-xl ${getClassColor(cls.color, index)}`}
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-base-content mb-1">
                        {cls.name}
                      </h3>
                      <p className="text-sm text-base-content/60 mb-3">
                        {cls.period && `Period ${cls.period} • `}
                        {cls.teacher?.full_name || "Unknown Teacher"}
                      </p>

                      <div className="flex gap-2">
                        <Link
                          href={`/student/classes/${cls.id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <ClipboardList className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/student/messages?class=${cls.id}`}>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
