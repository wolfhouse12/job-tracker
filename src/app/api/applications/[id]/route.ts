import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;
  const body = await request.json();
  const { status, company, role, jobDescription, notes } = body;

  const data: Record<string, string | null> = {};
  if (status !== undefined) data.status = status;
  if (company !== undefined) data.company = company;
  if (role !== undefined) data.role = role;
  if (jobDescription !== undefined) data.jobDescription = jobDescription;
  if (notes !== undefined) data.notes = notes;

  const application = await prisma.application.updateMany({
    where: { id, userId },
    data,
  });

  if (application.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await props.params;

  const result = await prisma.application.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
