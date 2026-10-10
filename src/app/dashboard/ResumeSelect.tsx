"use client";

import type { ResumeInfo } from "./ResumeUpload";

type Props = {
  resumes: ResumeInfo[];
  value: string;
  onChange: (resumeId: string) => void;
};

export function ResumeSelect({ resumes, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Resume sent</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={resumes.length === 0}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition disabled:opacity-50"
      >
        <option value="">{resumes.length === 0 ? "Upload a resume first" : "Not specified"}</option>
        {resumes.map((r) => (
          <option key={r.id} value={r.id}>{r.fileName}</option>
        ))}
      </select>
    </div>
  );
}
