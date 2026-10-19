import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/validation";

const MAX_RESUMES = 10;
const MAX_TEXT_LENGTH = 50_000;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, fileName: true, createdAt: true },
  });

  return NextResponse.json({ resumes });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.resume.count({ where: { userId } });
  if (count >= MAX_RESUMES) {
    return NextResponse.json({ error: `You can keep up to ${MAX_RESUMES} resumes. Remove one first.` }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let text = "";
  let fileName = "resume.txt";
  let name = "";

  if (contentType.includes("application/json")) {
    // Plain text paste
    const body = await readJson(request);
    if (!body || typeof body.text !== "string" || body.text.trim().length < 50) {
      return NextResponse.json({ error: "Please paste at least a few lines of your resume." }, { status: 400 });
    }
    text = body.text.trim();
    fileName = "resume (pasted text)";
    name = typeof body.name === "string" ? body.name : "";
  } else {
    // PDF upload
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    }
    const file = formData.get("resume");
    const nameField = formData.get("name");
    name = typeof nameField === "string" ? nameField : "";

    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File must be under 5MB." }, { status: 400 });

    try {
      const { extractText } = await import("unpdf");
      const buffer = await file.arrayBuffer();
      // The file name is chosen by the client; check the bytes are actually a PDF.
      if (new TextDecoder().decode(buffer.slice(0, 5)) !== "%PDF-") {
        return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
      }
      const { text: extracted } = await extractText(new Uint8Array(buffer), { mergePages: true });
      text = extracted.trim();
      fileName = file.name.slice(0, 100);
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

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "This resume is too long. Keep it under 50,000 characters." }, { status: 400 });
  }

  // A user-given name ("English", "Hebrew") beats the file name
  if (name.trim()) fileName = name.trim().slice(0, 100);

  const resume = await prisma.resume.create({
    data: { userId, text, fileName },
  });

  return NextResponse.json({ id: resume.id, fileName: resume.fileName, createdAt: resume.createdAt });
}
