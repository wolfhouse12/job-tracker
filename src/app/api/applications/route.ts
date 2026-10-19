import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseApplicationInput, readJson } from "@/lib/validation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.application.findMany({
    where: { userId },
    orderBy: { appliedAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = parseApplicationInput(body, false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { company, role, status, jobDescription, notes, resumeId } = parsed.data;

  // Only link a resume that belongs to this user
  if (resumeId) {
    const owned = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (!owned) return NextResponse.json({ error: "Resume not found" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: { userId, company: company!, role: role!, status, jobDescription, notes, resumeId },
  });

  return NextResponse.json(application, { status: 201 });
}
