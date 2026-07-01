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
  notes: string | null,
  resumeText: string | null
): string {
  const resumeSection = resumeText
    ? `\nMy Resume:\n---\n${resumeText}\n---`
    : "";

  const jd = jobDescription ? `\nJob Description:\n${jobDescription}` : "";
  const n = notes ? `\nNotes: ${notes}` : "";

  if (feature === "cover-letter") {
    return `You are a professional cover letter writer.${resumeSection}

Write a cover letter for the following job:
Company: ${company}
Role: ${role}${jd}${n}

${resumeText
  ? "Use my resume above to write a personalized letter that highlights my most relevant experience and skills for this specific role."
  : "Write a compelling, professional cover letter."}
Keep it to 3–4 paragraphs. End with a clear call to action.`;
  }

  if (feature === "interview-prep") {
    return `You are a career coach helping prepare for a job interview.${resumeSection}

Job I'm interviewing for:
Company: ${company}
Role: ${role}${jd}

Provide:
1. 6 interview questions likely to be asked for this specific role
${resumeText ? "2. For each question, suggest how to answer based on my resume\n3. Skills to brush up on given my background\n4. 2–3 tips for this company/role" : "2. Key topics to study\n3. 2–3 tips for this role"}`;
  }

  if (feature === "follow-up") {
    return `You are a professional writing assistant.${resumeSection}

Write a follow-up email for a job application:
Company: ${company}
Role: ${role}${n}

Write a brief (3–5 sentences), warm follow-up email. ${resumeText ? "Reference a specific relevant skill or experience from my resume." : "Express genuine enthusiasm for the role."}`;
  }

  if (feature === "optimize") {
    if (!resumeText) {
      return `The user has not uploaded a resume yet. Politely explain that they need to upload their resume first using the resume section above the applications table, then they can use this feature.`;
    }
    return `You are a resume optimization expert.

My Resume:
---
${resumeText}
---

Job I'm applying for:
Company: ${company}
Role: ${role}${jd}

Analyze my resume for this specific job and provide:
1. Match score (out of 10) — how well my resume fits this role and why
2. Top 3 strengths to highlight for this application
3. Gaps to address (missing keywords, skills, or experience)
4. Specific bullet point improvements — rewrite 2–3 of my existing bullets to better match this job
5. Keywords from the job description I should add to my resume`;
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

  if (!["cover-letter", "interview-prep", "follow-up", "optimize"].includes(feature)) {
    return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
  }

  const [application, resume] = await Promise.all([
    prisma.application.findFirst({ where: { id, userId } }),
    prisma.resume.findUnique({ where: { userId } }),
  ]);

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { company, role, jobDescription, notes } = application;
  const prompt = buildPrompt(feature, company, role, jobDescription, notes, resume?.text ?? null);

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
