import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI is not configured. Missing ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const body = await request.json();
    const { prompt, tool, classId, context, messages } = body;

    // Callers may send either a single `prompt` (legacy) or a full `messages`
    // array. The messages form powers the continue-generation loop: the client
    // resends what has been generated so far as a trailing assistant message so
    // the model picks up exactly where it left off.
    const useMessages =
      Array.isArray(messages) &&
      messages.length > 0 &&
      messages.every(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
      );

    if (!useMessages && !prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let systemPrompt = "";
    const isTeacher = profile?.role === "teacher";

    if (isTeacher) {
      switch (tool) {
        case "lesson-plan":
          systemPrompt = `You are an expert educational curriculum designer. Create detailed, engaging lesson plans that include:
- Clear learning objectives
- Required materials
- Step-by-step activities with time estimates
- Differentiation strategies for various learning levels
- Assessment methods
- Extension activities for advanced learners
Format the output in a clear, organized structure.`;
          break;
        case "quiz":
          systemPrompt = `You are an expert assessment creator. Generate a multiple-choice quiz as STRICT, VALID JSON only. Do NOT include markdown, code fences, or any commentary before or after the JSON.

The JSON must match this exact schema:
{
  "title": "Concise quiz title",
  "questions": [
    {
      "question": "The full question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why the correct answer is right"
    }
  ]
}

Rules:
- Every question MUST have exactly 4 options.
- "correctIndex" is the 0-based index (0-3) of the correct option in the "options" array.
- Do NOT put letter prefixes like "A)" or markers like "*" inside the option text.
- Generate 8-10 questions unless the user specifies a different number.
- Make questions appropriate for the specified grade level and assess real understanding.
- Output ONLY the raw JSON object. The very first character must be "{" and the very last character must be "}".`;
          break;
        case "differentiation":
          systemPrompt = `You are an expert in differentiated instruction. Help teachers adapt content by providing:
- Modified versions for different learning levels (below grade, on grade, above grade)
- Accommodations for various learning styles
- Scaffolding strategies
- Alternative assessment options
- Support materials and resources`;
          break;
        case "rubric":
          systemPrompt = `You are an expert in educational assessment. Create comprehensive rubrics that:
- Define clear criteria for each performance level
- Use specific, measurable descriptors
- Align with learning objectives
- Include point values
- Are easy to use for grading
Format as a clear table or matrix structure.`;
          break;
        default:
          systemPrompt = `You are a helpful AI assistant for teachers. Provide educational support and resources.`;
      }
    } else {
      systemPrompt = `You are a friendly and encouraging AI tutor helping a student learn. You should:
- Explain concepts in clear, simple terms appropriate for their level
- Use analogies and examples to make abstract concepts concrete
- Ask guiding questions rather than just giving answers
- Celebrate their efforts and progress
- Break down complex problems into smaller steps
- Be patient and supportive
${context ? `\nContext about the student's classes: ${context}` : ""}`;
    }

    const contentType = isTeacher ? tool || "general" : "tutor_session";
    const encoder = new TextEncoder();
    let fullText = "";

    // Keep each generation call small enough to comfortably finish inside the
    // serverless time budget; the client stitches multiple calls together via
    // the continue-generation loop for longer content.
    const maxTokens = useMessages ? 2200 : tool === "quiz" ? 3000 : 6000;

    const apiMessages = useMessages
      ? (messages as { role: "user" | "assistant"; content: string }[]).map((m) => ({
          role: m.role,
          content: m.content,
        }))
      : [{ role: "user" as const, content: prompt }];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const messageStream = anthropic.messages.stream({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: apiMessages,
          });

          for await (const event of messageStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullText += event.delta.text;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          // In messages mode, tell the client why we stopped so it knows
          // whether to request a continuation. If the function times out
          // mid-stream this sentinel never arrives and the client also
          // continues — so truncation is recovered either way.
          if (useMessages) {
            let stopReason = "end_turn";
            try {
              const final = await messageStream.finalMessage();
              stopReason = final.stop_reason || "end_turn";
            } catch {
              stopReason = "end_turn";
            }
            controller.enqueue(encoder.encode(`\n<<<GB_STOP:${stopReason}>>>`));
          } else {
            // Persist single-shot (legacy) generations for history.
            try {
              await supabase.from("ai_content").insert({
                user_id: user.id,
                class_id: classId || null,
                content_type: contentType,
                title: (prompt || "").slice(0, 100),
                prompt: prompt || "",
                content: { response: fullText },
              });
            } catch (dbError) {
              console.error("Failed to save AI content:", dbError);
            }
          }

          controller.close();
        } catch (error) {
          console.error("AI streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
