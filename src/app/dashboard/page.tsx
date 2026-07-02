"use client";

import { UserButton } from "@clerk/nextjs";
import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { KanbanView } from "./KanbanView";
import { ResumeUpload } from "./ResumeUpload";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  APPLIED: "bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-900",
  PHONE_SCREEN: "bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-900",
  INTERVIEW: "bg-violet-50 text-violet-600 ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-900",
  OFFER: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-900",
  REJECTED: "bg-red-50 text-red-500 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-900",
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  PHONE_SCREEN: "Phone Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-orange-500", "bg-pink-500", "bg-cyan-500", "bg-indigo-500",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function timeAgo(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(date).toLocaleDateString();
}

const AI_FEATURES = [
  { key: "cover-letter",   label: "Cover Letter",    icon: "📝" },
  { key: "interview-prep", label: "Interview Prep",  icon: "🎯" },
  { key: "follow-up",      label: "Follow-up Email", icon: "✉️" },
  { key: "optimize",       label: "Optimize Resume", icon: "⚡" },
] as const;

type AiFeature = (typeof AI_FEATURES)[number]["key"];

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ company: "", role: "", jobDescription: "", notes: "" });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ company: "", role: "", jobDescription: "", notes: "" });
  const [deletingRow, setDeletingRow] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [activeAiRow, setActiveAiRow] = useState<string | null>(null);
  const [aiFeature, setAiFeature] = useState<AiFeature | null>(null);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  function startEdit(app: Application) {
    setEditForm({
      company: app.company,
      role: app.role,
      jobDescription: app.jobDescription ?? "",
      notes: app.notes ?? "",
    });
    setEditingRow(app.id);
    setExpandedRow(app.id);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>, appId: string) {
    e.preventDefault();
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setApplications(applications.map((a) => a.id === appId ? { ...a, ...editForm } : a));
    setEditingRow(null);
  }

  async function handleDelete(appId: string) {
    await fetch(`/api/applications/${appId}`, { method: "DELETE" });
    setApplications(applications.filter((a) => a.id !== appId));
    setDeletingRow(null);
  }

  function toggleAiPanel(appId: string) {
    if (activeAiRow === appId) {
      setActiveAiRow(null); setAiContent(null); setAiFeature(null);
    } else {
      setActiveAiRow(appId); setAiContent(null); setAiFeature(null);
    }
  }

  async function generateAiContent(appId: string, feature: AiFeature) {
    setAiFeature(feature); setAiContent(null); setAiLoading(true);
    const res = await fetch(`/api/applications/${appId}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature }),
    });
    const data = await res.json();
    setAiContent(data.content ?? data.error ?? "Something went wrong.");
    setAiLoading(false);
  }

  const filteredApplications = applications.filter((app) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || app.company.toLowerCase().includes(term) || app.role.toLowerCase().includes(term);
    const matchesStatus = filterStatus === "ALL" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const total = applications.length;
  const inProgress = applications.filter((a) => ["PHONE_SCREEN", "INTERVIEW"].includes(a.status)).length;
  const offers = applications.filter((a) => a.status === "OFFER").length;
  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* Nav */}
      <nav className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-xs font-bold tracking-tight">JT</span>
            </div>
            <span className="hidden sm:block font-semibold text-slate-800 dark:text-slate-100 text-sm">Job Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold text-violet-600 bg-violet-50 dark:bg-violet-900/30 transition-colors">
              Dashboard
            </Link>
            <Link href="/analytics" className="px-2.5 sm:px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
              Analytics
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 px-4 sm:px-6 pt-6 sm:pt-10 pb-10 sm:pb-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">Overview</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm mb-6 sm:mb-8">Your job search at a glance</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Applied", value: total,          color: "text-white",        sub: "applications" },
              { label: "In Progress",   value: inProgress,     color: "text-violet-300",   sub: "active" },
              { label: "Offers",        value: offers,         color: "text-emerald-300",  sub: "received" },
              { label: "Success Rate",  value: `${successRate}%`, color: "text-amber-300", sub: "offer rate" },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 sm:p-5 hover:bg-white/10 transition-colors">
                <p className="text-slate-400 text-xs font-medium mb-2 sm:mb-3">{label}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${color} mb-1`}>{value}</p>
                <p className="text-slate-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-5">

        {/* View toggle + Add button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 w-fit">
            {(["table", "kanban"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                  view === v
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {v === "table" ? "☰ Table" : "⬛ Kanban"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 px-5 py-2.5 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-200 dark:shadow-violet-900/50 sm:ml-auto"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Application
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or role..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-700 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: "ALL",          label: "All" },
              { key: "APPLIED",      label: "Applied" },
              { key: "PHONE_SCREEN", label: "Phone Screen" },
              { key: "INTERVIEW",    label: "Interview" },
              { key: "OFFER",        label: "Offer" },
              { key: "REJECTED",     label: "Rejected" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterStatus === key
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                {label}
                {key !== "ALL" && (
                  <span className={`ml-1.5 ${filterStatus === key ? "text-violet-200" : "text-slate-400 dark:text-slate-500"}`}>
                    {applications.filter((a) => a.status === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* New application form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-5">New Application</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Company *</label>
                  <input
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    placeholder="Stripe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Role *</label>
                  <input
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    placeholder="Frontend Engineer"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Job Description
                  <span className="ml-2 normal-case font-normal text-slate-300 dark:text-slate-500">paste for better AI results</span>
                </label>
                <textarea
                  value={form.jobDescription}
                  onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
                  rows={4}
                  placeholder="Paste the job description here..."
                />
              </div>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
                  rows={2}
                  placeholder="Referral from John, hybrid role..."
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-white text-sm font-semibold transition-colors">
                  Save Application
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <ResumeUpload />

        {view === "kanban" && (
          <KanbanView
            applications={filteredApplications}
            onStatusChange={updateStatus}
            onEdit={(id, data) => setApplications((prev) => prev.map((a) => a.id === id ? { ...a, ...data } : a))}
            onDelete={(id) => setApplications((prev) => prev.filter((a) => a.id !== id))}
          />
        )}

        {/* Table card */}
        <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8 ${view === "kanban" ? "hidden" : ""}`}>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-slate-400 text-sm">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 text-2xl select-none">
                {applications.length === 0 ? "📋" : "🔍"}
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {applications.length === 0 ? "No applications yet" : "No results found"}
              </p>
              <p className="text-sm text-slate-400">
                {applications.length === 0 ? "Add your first one to get started." : "Try a different search or filter."}
              </p>
              {applications.length > 0 && (
                <button onClick={() => { setSearch(""); setFilterStatus("ALL"); }} className="mt-3 text-sm text-violet-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Applied</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Notes</th>
                    <th className="px-4 sm:px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <Fragment key={app.id}>
                      <tr className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${avatarColor(app.company)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <span className="text-white text-sm font-bold">{app.company[0].toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white leading-tight truncate">{app.company}</p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">{app.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none ${STATUS_COLORS[app.status]}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs text-slate-400 hidden sm:table-cell">{timeAgo(app.appliedAt)}</td>
                        <td className="px-4 sm:px-6 py-4 text-xs text-slate-400 max-w-[180px] truncate hidden md:table-cell">{app.notes ?? "—"}</td>
                        <td className="px-4 sm:px-6 py-4">
                          {deletingRow === app.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Delete?</span>
                              <button onClick={() => handleDelete(app.id)} className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Yes</button>
                              <button onClick={() => setDeletingRow(null)} className="rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setExpandedRow(expandedRow === app.id ? null : app.id)}
                                title="View details"
                                className={`rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 ${expandedRow === app.id ? "!opacity-100 text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700" : ""}`}
                              >
                                <svg className={`w-4 h-4 transition-transform ${expandedRow === app.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => startEdit(app)}
                                title="Edit"
                                className={`rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 ${editingRow === app.id ? "!opacity-100 text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700" : ""}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeletingRow(app.id)}
                                title="Delete"
                                className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <button
                                onClick={() => toggleAiPanel(app.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                  activeAiRow === app.id
                                    ? "bg-violet-600 text-white shadow-sm"
                                    : "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 opacity-0 group-hover:opacity-100"
                                }`}
                              >
                                {activeAiRow === app.id ? "✕ Close" : "✨ AI"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {expandedRow === app.id && (
                        <tr className="border-b border-slate-100 dark:border-slate-700/50">
                          <td colSpan={5} className="px-4 sm:px-6 py-5 bg-slate-50/70 dark:bg-slate-700/50">
                            {editingRow === app.id ? (
                              <form onSubmit={(e) => handleEdit(e, app.id)}>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Edit Application</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Company *</label>
                                    <input required value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Role *</label>
                                    <input required value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                                  </div>
                                </div>
                                <div className="mb-4">
                                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Job Description</label>
                                  <textarea value={editForm.jobDescription} onChange={(e) => setEditForm({ ...editForm, jobDescription: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" rows={3} />
                                </div>
                                <div className="mb-4">
                                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes</label>
                                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" rows={2} />
                                </div>
                                <div className="flex gap-3">
                                  <button type="submit" className="rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2 text-white text-sm font-semibold transition-colors">Save Changes</button>
                                  <button type="button" onClick={() => setEditingRow(null)} className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                </div>
                              </form>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {app.notes || <span className="text-slate-300 dark:text-slate-500 italic">No notes added.</span>}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Description</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {app.jobDescription || <span className="text-slate-300 dark:text-slate-500 italic">No job description saved.</span>}
                                  </p>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}

                      {activeAiRow === app.id && (
                        <tr className="border-b border-slate-100 dark:border-slate-700/50">
                          <td colSpan={5} className="px-4 sm:px-6 py-5 bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-xs font-semibold text-violet-500 uppercase tracking-widest">AI Assistant</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-xs text-slate-400 truncate">{app.company} — {app.role}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {AI_FEATURES.map(({ key, label, icon }) => (
                                <button
                                  key={key}
                                  onClick={() => generateAiContent(app.id, key)}
                                  disabled={aiLoading}
                                  className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all disabled:opacity-50 ${
                                    aiFeature === key
                                      ? "bg-violet-600 text-white shadow-sm"
                                      : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:border-violet-300 hover:text-violet-600"
                                  }`}
                                >
                                  <span>{icon}</span>
                                  {label}
                                </button>
                              ))}
                            </div>

                            {aiLoading && (
                              <div className="flex items-center gap-2 text-violet-500 text-sm py-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Generating with AI...
                              </div>
                            )}

                            {aiContent && !aiLoading && (
                              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
                                <div className="flex justify-end mb-3">
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(aiContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    {copied ? (
                                      <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                                    ) : (
                                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                                    )}
                                  </button>
                                </div>
                                <pre className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{aiContent}</pre>
                              </div>
                            )}

                            {!aiFeature && !aiLoading && (
                              <p className="text-sm text-slate-400">Select a tool above to generate content for this application.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
