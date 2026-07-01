import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

function buildPrompt(
  feature: string,
  company: string,
  role: string,
  jobDescription: string | null,
  notes: string | null
): string {
  const jd = jobDescription ? `\nJob Description: ${jobDescription}` : "";
  const n = notes ? `\nNotes: ${notes}` : "";

  if (feature === "cover-letter") {
    return `Write a professional cover letter for the following job application:
Company: ${company}
Role: ${role}${jd}${n}

Write a compelling, personalized cover letter (3–4 paragraphs). Use a professional tone and end with a clear call to action.`;
  }

  if (feature === "interview-prep") {
    return `Generate interview preparation material for the following job:
Company: ${company}
Role: ${role}${jd}

Provide:
1. 6 likely interview questions tailored to this role
2. Key skills and topics to brush up on
3. 2–3 tips specific to this company or role`;
  }

  if (feature === "follow-up") {
    return `Write a professional follow-up email for a job application:
Company: ${company}
Role: ${role}${n}

Write a brief (3–5 sentences), warm follow-up email to send after applying. Express enthusiasm and invite a conversation.`;
  }

  return "";
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const { feature } = await request.json();

  if (!["cover-letter", "interview-prep", "follow-up"].includes(feature)) {
    return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
  }

  const application = await prisma.application.findFirst({
    where: { id, userId },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { company, role, jobDescription, notes } = application;
  const prompt = buildPrompt(feature, company, role, jobDescription, notes);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });
    const content = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI route error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
