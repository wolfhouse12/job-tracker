"use client";

import { useState, useEffect, useRef } from "react";

type ResumeInfo = { id: string; fileName: string; createdAt: string } | null;

export function ResumeUpload() {
  const [resume, setResume] = useState<ResumeInfo>(null);
  const [tab, setTab] = useState<"pdf" | "paste">("pdf");
  const [pasteText, setPasteText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => r.json())
      .then((data) => setResume(data.resume ?? null));
  }, []);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) { setError("Please upload a PDF file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File must be under 5MB."); return; }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("resume", file);
    const res = await fetch("/api/resume", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) { setResume(data); }
    else { setError(data.error ?? "Upload failed."); }
    setUploading(false);
  }

  async function handlePaste() {
    if (pasteText.trim().length < 50) { setError("Please paste more text — at least a few lines of your resume."); return; }
    setUploading(true);
    setError(null);
    const res = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pasteText }),
    });
    const data = await res.json();
    if (res.ok) { setResume(data); setPasteText(""); }
    else { setError(data.error ?? "Save failed."); }
    setUploading(false);
  }

  async function handleDelete() {
    await fetch("/api/resume", { method: "DELETE" });
    setResume(null);
  }

  if (resume) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Resume uploaded</p>
            <p className="text-xs text-slate-400">{resume.fileName} · AI will use this for all features</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setResume(null); }} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline underline-offset-2 transition-colors">
            Replace
          </button>
          <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors">
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📄</span>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Upload your resume</p>
          <p className="text-xs text-slate-400">AI will use it to personalise cover letters, interview prep, and resume feedback</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-4 w-fit">
        {(["pdf", "paste"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              tab === t
                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t === "pdf" ? "📎 Upload PDF" : "📋 Paste text"}
          </button>
        ))}
      </div>

      {tab === "pdf" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-colors ${
            dragging ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20" : "border-slate-200 dark:border-slate-600 hover:border-violet-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-violet-500 text-sm">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Reading PDF...
            </div>
          ) : (
            <>
              <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-slate-500 dark:text-slate-400">Drop your PDF here or <span className="text-violet-600 dark:text-violet-400 font-medium">browse</span></p>
              <p className="text-xs text-slate-400">PDF only · max 5MB</p>
            </>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            rows={8}
            placeholder="Open your resume in Word or Google Docs, select all (Ctrl+A), copy (Ctrl+C), then paste here (Ctrl+V)..."
          />
          <button
            onClick={handlePaste}
            disabled={uploading || pasteText.trim().length < 50}
            className="mt-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 px-5 py-2.5 text-white text-sm font-semibold transition-colors"
          >
            {uploading ? "Saving..." : "Save Resume"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <input ref={inputRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
