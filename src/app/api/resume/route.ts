import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await prisma.resume.findUnique({ where: { userId } });
  if (!resume) return NextResponse.json({ resume: null });

  return NextResponse.json({
    resume: { id: resume.id, fileName: resume.fileName, createdAt: resume.createdAt },
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";

  let text = "";
  let fileName = "resume.txt";

  if (contentType.includes("application/json")) {
    // Plain text paste
    const body = await request.json();
    if (!body.text || typeof body.text !== "string" || body.text.trim().length < 50) {
      return NextResponse.json({ error: "Please paste at least a few lines of your resume." }, { status: 400 });
    }
    text = body.text.trim();
    fileName = "resume (pasted text)";
  } else {
    // PDF upload
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File must be under 5MB." }, { status: 400 });

    try {
      const { extractText } = await import("unpdf");
      const buffer = await file.arrayBuffer();
      const { text: extracted } = await extractText(new Uint8Array(buffer), { mergePages: true });
      text = extracted.trim();
      fileName = file.name;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[resume pdf error]", msg);
      return NextResponse.json(
        { error: "Could not read this PDF. Try the 'Paste text' tab instead — copy your resume text directly from Word or Google Docs." },
        { status: 400 }
      );
    }

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "This PDF appears to be image-based (scanned) so no text could be extracted. Use the 'Paste text' tab instead." },
        { status: 400 }
      );
    }
  }

  const resume = await prisma.resume.upsert({
    where: { userId },
    update: { text, fileName },
    create: { userId, text, fileName },
  });

  return NextResponse.json({ id: resume.id, fileName: resume.fileName, createdAt: resume.createdAt });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.resume.deleteMany({ where: { userId } });
  return NextResponse.json({ success: true });
}
