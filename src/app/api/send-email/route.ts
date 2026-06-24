import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SendEmailBody = {
  classId: string;
  subject: string;
  message: string;
  // When provided, only these profile ids receive the email (e.g. a direct message).
  // When omitted, every active student enrolled in the class receives it.
  recipientIds?: string[];
  // Addresses typed in by the teacher; sent in addition to any on-file student emails.
  manualEmails?: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtml(subject: string, message: string, className: string, teacherName: string): string {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#4f46e5;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">GradeBridge</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">${escapeHtml(className)}</p>
                <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">${escapeHtml(subject)}</h1>
                <div style="font-size:15px;line-height:1.6;color:#374151;">${safeMessage}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid #eef0f3;">
                <p style="margin:0;font-size:13px;color:#6b7280;">Sent by ${escapeHtml(teacherName)} via GradeBridge</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email is not configured. Add RESEND_API_KEY to your environment." },
      { status: 503 }
    );
  }

  let body: SendEmailBody;
  try {
    body = (await req.json()) as SendEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { classId, subject, message, recipientIds, manualEmails } = body;
  if (!classId || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "classId, subject, and message are required." },
      { status: 400 }
    );
  }

  // Validate any manually-entered addresses up front.
  const cleanedManual = (manualEmails || [])
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  const invalidManual = cleanedManual.filter((e) => !EMAIL_RE.test(e));
  if (invalidManual.length > 0) {
    return NextResponse.json(
      { error: `Invalid email address: ${invalidManual.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Confirm the requester owns the class they're emailing.
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, teacher_id")
    .eq("id", classId)
    .single();

  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "You don't have access to this class." }, { status: 403 });
  }

  // Resolve which student profile ids should receive the email.
  // An explicit array (even empty) is used as-is; only `undefined` falls back
  // to emailing the whole class.
  let targetIds: string[] = [];
  if (Array.isArray(recipientIds)) {
    targetIds = recipientIds;
  } else {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("user_id")
      .eq("class_id", classId)
      .eq("is_active", true)
      .not("user_id", "is", null);
    targetIds = (enrollments || [])
      .map((e) => e.user_id)
      .filter((id): id is string => Boolean(id));
  }

  let onFileEmails: string[] = [];
  if (targetIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", targetIds);
    onFileEmails = (profiles || [])
      .map((p) => p.email)
      .filter((e): e is string => Boolean(e && EMAIL_RE.test(e)))
      .map((e) => e.toLowerCase());
  }

  // Combine on-file student emails with any manually-entered addresses (deduped).
  const emails = Array.from(new Set([...onFileEmails, ...cleanedManual]));

  if (emails.length === 0) {
    return NextResponse.json(
      {
        error:
          "No valid recipients. The selected students have no email on file — enter an address manually to send.",
      },
      { status: 400 }
    );
  }

  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const teacherName = teacherProfile?.full_name || "Your teacher";

  const fromAddress = process.env.EMAIL_FROM || "GradeBridge <onboarding@resend.dev>";
  const html = buildHtml(subject.trim(), message.trim(), cls.name, teacherName);

  const resend = new Resend(apiKey);

  try {
    // Send individually so recipients don't see each other's addresses.
    const results = await Promise.allSettled(
      emails.map((to) =>
        resend.emails.send({
          from: fromAddress,
          to,
          replyTo: user.email || undefined,
          subject: subject.trim(),
          html,
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled" && !(r.value as { error?: unknown }).error).length;
    const failed = emails.length - sent;

    if (sent === 0) {
      return NextResponse.json(
        { error: "Failed to send emails. Check your Resend configuration and verified domain." },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Unknown error sending email.";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
