import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const body = await request.json();
  const { company, role, jobDescription, notes } = body;

  if (!company || !role) {
    return NextResponse.json({ error: "Company and role are required" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: { userId, company, role, jobDescription, notes },
  });

  return NextResponse.json(application, { status: 201 });
}
