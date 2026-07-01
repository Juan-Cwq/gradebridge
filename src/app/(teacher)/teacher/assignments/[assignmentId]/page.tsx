"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Check,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBrowserClient } from "@supabase/ssr";
import type { Annotation } from "@/components/ui/DocumentAnnotator";

const DocumentAnnotator = dynamic(() => import("@/components/ui/DocumentAnnotator"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full gap-2 text-base-content/60">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading viewer…
    </div>
  ),
});

type AssignmentInfo = {
  id: string;
  name: string;
  description: string | null;
  points_possible: number;
  class_id: string;
  class: { id: string; name: string } | null;
};

type Submission = {
  id: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  status: string;
  submitted_at: string;
} | null;

type Row = {
  studentId: string;
  fullName: string;
  submission: Submission;
  pointsEarned: number | null;
  feedback: string;
  gradeStatus: string | null;
};

export default function GradeSubmissionsPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setTeacherId(user.id);

      const { data: a } = await supabase
        .from("assignments")
        .select("id, name, description, points_possible, class_id, class:classes(id, name, teacher_id)")
        .eq("id", assignmentId)
        .single();

      const cls = a?.class as unknown as { id: string; name: string; teacher_id: string } | null;
      if (!a || !cls || cls.teacher_id !== user.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setAssignment({
        id: a.id,
        name: a.name,
        description: a.description,
        points_possible: a.points_possible,
        class_id: a.class_id,
        class: cls ? { id: cls.id, name: cls.name } : null,
      });

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, user:profiles!enrollments_user_id_fkey(id, full_name)")
        .eq("class_id", a.class_id)
        .eq("is_active", true)
        .not("user_id", "is", null);

      const students = (enrollments || [])
        .map((e) => {
          const u = e.user as unknown as { id: string; full_name: string | null } | null;
          return u ? { id: u.id, full_name: u.full_name || "Unknown Student" } : null;
        })
        .filter((s): s is { id: string; full_name: string } => s !== null);

      const studentIds = students.map((s) => s.id);

      const { data: subs } = await supabase
        .from("submissions")
        .select("id, student_id, file_url, file_name, file_type, status, submitted_at")
        .eq("assignment_id", assignmentId);

      const { data: grades } = await supabase
        .from("grades")
        .select("student_id, points_earned, feedback, status")
        .eq("assignment_id", assignmentId)
        .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"]);

      const subMap = new Map((subs || []).map((s) => [s.student_id, s]));
      const gradeMap = new Map((grades || []).map((g) => [g.student_id, g]));

      const builtRows: Row[] = students.map((s) => {
        const sub = subMap.get(s.id);
        const grade = gradeMap.get(s.id);
        return {
          studentId: s.id,
          fullName: s.full_name,
          submission: sub
            ? {
                id: sub.id,
                file_url: sub.file_url,
                file_name: sub.file_name,
                file_type: sub.file_type,
                status: sub.status,
                submitted_at: sub.submitted_at,
              }
            : null,
          pointsEarned: grade?.points_earned ?? null,
          feedback: grade?.feedback ?? "",
          gradeStatus: grade?.status ?? null,
        };
      });

      // Sort: submitted-but-ungraded first, then graded, then no submission
      builtRows.sort((x, y) => {
        const rank = (r: Row) =>
          r.submission && r.gradeStatus !== "graded" ? 0 : r.submission ? 1 : 2;
        return rank(x) - rank(y) || x.fullName.localeCompare(y.fullName);
      });

      setRows(builtRows);
      const firstWithSub = builtRows.find((r) => r.submission);
      if (firstWithSub) setSelectedId(firstWithSub.studentId);
      setLoading(false);
    };

    load();
  }, [assignmentId, supabase]);

  const selectedRow = rows.find((r) => r.studentId === selectedId) || null;

  const loadAnnotations = useCallback(
    async (submissionId: string) => {
      setLoadingAnnotations(true);
      const { data } = await supabase
        .from("submission_annotations")
        .select("id, page, x, y, width, height, type, color, body")
        .eq("submission_id", submissionId);
      setAnnotations((data as Annotation[]) || []);
      setLoadingAnnotations(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (selectedRow?.submission?.id) {
      loadAnnotations(selectedRow.submission.id);
    } else {
      setAnnotations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow?.submission?.id]);

  const handleCreateAnnotation = async (a: Omit<Annotation, "id">) => {
    const submissionId = selectedRow?.submission?.id;
    if (!submissionId || !teacherId) return null;
    const { data, error } = await supabase
      .from("submission_annotations")
      .insert({ submission_id: submissionId, teacher_id: teacherId, ...a })
      .select("id, page, x, y, width, height, type, color, body")
      .single();
    if (error || !data) return null;
    const created = data as Annotation;
    setAnnotations((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateAnnotation = async (id: string, patch: Partial<Annotation>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    await supabase.from("submission_annotations").update(patch).eq("id", id);
  };

  const handleDeleteAnnotation = async (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("submission_annotations").delete().eq("id", id);
  };

  const updateRow = (studentId: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)));
  };

  const handleSaveGrade = async () => {
    if (!selectedRow || !assignment) return;
    setSaving(true);

    const points = selectedRow.pointsEarned;
    const percentage =
      points !== null && assignment.points_possible > 0
        ? Math.round((points / assignment.points_possible) * 100)
        : null;

    const payload = {
      points_earned: points,
      percentage,
      feedback: selectedRow.feedback || null,
      status: "graded",
      graded_at: new Date().toISOString(),
      submitted_at: selectedRow.submission?.submitted_at ?? new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("grades")
      .select("id")
      .eq("assignment_id", assignment.id)
      .eq("student_id", selectedRow.studentId)
      .maybeSingle();

    if (existing) {
      await supabase.from("grades").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("grades").insert({
        assignment_id: assignment.id,
        student_id: selectedRow.studentId,
        ...payload,
      });
    }

    if (selectedRow.submission?.id) {
      await supabase
        .from("submissions")
        .update({ status: "graded" })
        .eq("id", selectedRow.submission.id);
    }

    updateRow(selectedRow.studentId, { gradeStatus: "graded" });

    // notify the student
    await supabase.from("notifications").insert({
      user_id: selectedRow.studentId,
      type: "grade",
      title: `Graded: ${assignment.name}`,
      message: `You scored ${points ?? "--"} / ${assignment.points_possible} on ${assignment.name}.`,
      link: "/student/grades",
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (notFound || !assignment) {
    return (
      <div className="space-y-4">
        <Link href="/teacher/assignments" className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content">
          <ArrowLeft className="w-4 h-4" /> Back to assignments
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="font-semibold mb-1">Assignment not found</h3>
            <p className="text-sm text-base-content/60">
              This assignment doesn&apos;t exist or you don&apos;t have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submittedCount = rows.filter((r) => r.submission).length;
  const gradedCount = rows.filter((r) => r.gradeStatus === "graded").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/teacher/assignments"
            className="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Assignments
          </Link>
          <h1 className="text-2xl font-display font-bold text-base-content">{assignment.name}</h1>
          <p className="text-base-content/60 text-sm">
            {assignment.class?.name} · {assignment.points_possible} points
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-base-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-base-content/60" />
            {submittedCount} submitted
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {gradedCount} graded
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Roster */}
        <Card className="lg:sticky lg:top-4 self-start">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-base-200 font-medium text-sm">
              Students ({rows.length})
            </div>
            <div className="divide-y divide-base-200 max-h-[70vh] overflow-y-auto">
              {rows.length === 0 && (
                <p className="p-4 text-sm text-base-content/50">No students enrolled yet.</p>
              )}
              {rows.map((r) => {
                const active = r.studentId === selectedId;
                return (
                  <button
                    key={r.studentId}
                    onClick={() => r.submission && setSelectedId(r.studentId)}
                    disabled={!r.submission}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-base-200"
                    } ${!r.submission ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">
                      {r.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.fullName}</p>
                      <p className="text-xs text-base-content/50">
                        {r.submission ? "Submitted" : "No submission"}
                      </p>
                    </div>
                    {r.gradeStatus === "graded" ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : r.submission ? (
                      <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Grading surface */}
        <div className="space-y-4 min-w-0">
          {!selectedRow || !selectedRow.submission ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
                <h3 className="font-semibold mb-1">No submission selected</h3>
                <p className="text-sm text-base-content/60">
                  {submittedCount === 0
                    ? "No students have submitted yet."
                    : "Select a student who has submitted to review their work."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="h-[65vh]">
                    {loadingAnnotations ? (
                      <div className="flex items-center justify-center h-full gap-2 text-base-content/60">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
                      </div>
                    ) : (
                      selectedRow.submission.file_url && (
                        <DocumentAnnotator
                          key={selectedRow.submission.id}
                          fileUrl={selectedRow.submission.file_url}
                          fileType={selectedRow.submission.file_type}
                          fileName={selectedRow.submission.file_name}
                          annotations={annotations}
                          editable
                          onCreate={handleCreateAnnotation}
                          onUpdate={handleUpdateAnnotation}
                          onDelete={handleDeleteAnnotation}
                        />
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Grade panel */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Grade — {selectedRow.fullName}</h3>
                    <a
                      href={selectedRow.submission.file_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Open original file
                    </a>
                  </div>

                  <div className="grid sm:grid-cols-[160px_1fr] gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Points</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={assignment.points_possible}
                          value={selectedRow.pointsEarned ?? ""}
                          onChange={(e) =>
                            updateRow(selectedRow.studentId, {
                              pointsEarned: e.target.value === "" ? null : parseFloat(e.target.value),
                            })
                          }
                          placeholder="--"
                          className="w-24 px-3 py-2 rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-base-content/50 text-sm">
                          / {assignment.points_possible}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Overall feedback</label>
                      <textarea
                        value={selectedRow.feedback}
                        onChange={(e) =>
                          updateRow(selectedRow.studentId, { feedback: e.target.value })
                        }
                        rows={2}
                        placeholder="Summary comments for the student…"
                        className="w-full px-3 py-2 rounded-lg border border-base-300 bg-base-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-base-content/50">
                      Comments &amp; highlights you add on the document are saved automatically and shown to the student once you save the grade.
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleSaveGrade}
                      disabled={saving}
                      isLoading={saving}
                    >
                      {saved ? (
                        <>
                          <Check className="w-4 h-4 mr-2" /> Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {selectedRow.gradeStatus === "graded" ? "Update Grade" : "Save & Return"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {assignment.description && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Assignment instructions</p>
                    <div className="prose prose-sm max-w-none text-base-content/80 max-h-48 overflow-y-auto">
                      <ReactMarkdown>{assignment.description}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
