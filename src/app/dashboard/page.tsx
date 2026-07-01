"use client";

import { UserButton } from "@clerk/nextjs";
import { useState, useEffect, Fragment } from "react";

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: string;
  notes: string | null;
  jobDescription: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  PHONE_SCREEN: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  PHONE_SCREEN: "Phone Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const AI_FEATURES = [
  { key: "cover-letter", label: "Cover Letter" },
  { key: "interview-prep", label: "Interview Prep" },
  { key: "follow-up", label: "Follow-up Email" },
] as const;

type AiFeature = (typeof AI_FEATURES)[number]["key"];

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: "", role: "", jobDescription: "", notes: "" });

  const [activeAiRow, setActiveAiRow] = useState<string | null>(null);
  const [aiFeature, setAiFeature] = useState<AiFeature | null>(null);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => { setApplications(data); setLoading(false); });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const newApp = await res.json();
    setApplications([newApp, ...applications]);
    setForm({ company: "", role: "", jobDescription: "", notes: "" });
    setShowForm(false);
  }

  async function updateStatus(id: string, status: string) {
    setApplications(applications.map((a) => a.id === id ? { ...a, status } : a));
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function toggleAiPanel(appId: string) {
    if (activeAiRow === appId) {
      setActiveAiRow(null);
      setAiContent(null);
      setAiFeature(null);
    } else {
      setActiveAiRow(appId);
      setAiContent(null);
      setAiFeature(null);
    }
  }

  async function generateAiContent(appId: string, feature: AiFeature) {
    setAiFeature(feature);
    setAiContent(null);
    setAiLoading(true);
    const res = await fetch(`/api/applications/${appId}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature }),
    });
    const data = await res.json();
    setAiContent(data.content ?? data.error ?? "Something went wrong.");
    setAiLoading(false);
  }

  const total = applications.length;
  const inProgress = applications.filter((a) => ["PHONE_SCREEN", "INTERVIEW"].includes(a.status)).length;
  const offers = applications.filter((a) => a.status === "OFFER").length;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Job Tracker</h1>
        <UserButton />
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            + Add Application
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-blue-600">{inProgress}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Offers</p>
            <p className="text-3xl font-bold text-green-600">{offers}</p>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Application</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <input
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Frontend Developer"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description
                <span className="ml-1 text-xs text-gray-400 font-normal">(paste it here for better AI results)</span>
              </label>
              <textarea
                value={form.jobDescription}
                onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Paste the job description here..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Referral from John, hybrid role..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                Save
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-200">
          {loading ? (
            <p className="text-gray-500 text-center py-12">Loading...</p>
          ) : applications.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No applications yet. Add your first one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Company</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Applied</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Notes</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">AI</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <Fragment key={app.id}>
                    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{app.company}</td>
                      <td className="px-6 py-4 text-gray-600">{app.role}</td>
                      <td className="px-6 py-4">
                        <select
                          value={app.status}
                          onChange={(e) => updateStatus(app.id, e.target.value)}
                          className={`rounded-full px-2 py-1 text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[app.status]}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {app.notes ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleAiPanel(app.id)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                            activeAiRow === app.id
                              ? "bg-purple-600 text-white"
                              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                        >
                          {activeAiRow === app.id ? "Close" : "✨ AI"}
                        </button>
                      </td>
                    </tr>
                    {activeAiRow === app.id && (
                      <tr className="bg-purple-50 border-b border-gray-100">
                        <td colSpan={6} className="px-6 py-5">
                          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-3">
                            AI Tools — {app.company} · {app.role}
                          </p>
                          <div className="flex gap-2 mb-4">
                            {AI_FEATURES.map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => generateAiContent(app.id, key)}
                                disabled={aiLoading}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                                  aiFeature === key
                                    ? "bg-purple-600 text-white"
                                    : "bg-white border border-purple-300 text-purple-700 hover:bg-purple-100"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {aiLoading && (
                            <div className="flex items-center gap-2 text-purple-600 text-sm">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Generating...
                            </div>
                          )}
                          {aiContent && !aiLoading && (
                            <div className="bg-white rounded-lg border border-purple-200 p-4">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                {aiContent}
                              </pre>
                            </div>
                          )}
                          {!aiFeature && !aiLoading && (
                            <p className="text-sm text-gray-400">Select a tool above to generate content.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
