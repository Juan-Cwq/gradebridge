import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
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
    const { prompt, tool, classId, context } = body;

    if (!prompt) {
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
          systemPrompt = `You are an expert assessment creator. Generate quizzes that:
- Include a mix of question types (multiple choice, short answer, true/false)
- Cover key concepts thoroughly
- Include answer keys with explanations
- Are appropriate for the specified grade level
- Assess both recall and critical thinking
Format questions clearly with numbering and include the answer key at the end.`;
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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    const contentType = isTeacher ? tool || "general" : "tutor_session";

    await supabase.from("ai_content").insert({
      user_id: user.id,
      class_id: classId || null,
      content_type: contentType,
      title: prompt.slice(0, 100),
      prompt: prompt,
      content: { response: responseText },
    });

    return NextResponse.json({
      response: responseText,
      tool,
    });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
