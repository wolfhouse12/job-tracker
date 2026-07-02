"use client";

import { UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  AreaChart, Area, CartesianGrid,
} from "recharts";

type Application = {
  id: string;
  status: string;
  appliedAt: string;
};

const PIPELINE = [
  { key: "APPLIED",      label: "Applied",      color: "#3b82f6" },
  { key: "PHONE_SCREEN", label: "Phone Screen", color: "#f59e0b" },
  { key: "INTERVIEW",    label: "Interview",    color: "#8b5cf6" },
  { key: "OFFER",        label: "Offer",        color: "#10b981" },
  { key: "REJECTED",     label: "Rejected",     color: "#ef4444" },
];

function weekKey(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildTimeData(apps: Application[]) {
  const sorted = [...apps].sort(
    (a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
  );
  const weeks: Record<string, number> = {};
  sorted.forEach((app) => {
    const k = weekKey(app.appliedAt);
    weeks[k] = (weeks[k] || 0) + 1;
  });
  let cumulative = 0;
  return Object.entries(weeks).map(([week, count]) => {
    cumulative += count;
    return { week, count, cumulative };
  });
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
      <p className={`text-4xl font-bold mb-1 ${color}`}>{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => { setApplications(data); setLoading(false); });
  }, []);

  const total = applications.length;
  const offers = applications.filter((a) => a.status === "OFFER").length;
  const inProgress = applications.filter((a) => ["PHONE_SCREEN", "INTERVIEW"].includes(a.status)).length;
  const responseRate = total > 0
    ? Math.round((applications.filter((a) => a.status !== "APPLIED").length / total) * 100)
    : 0;

  const pipelineData = PIPELINE.map(({ key, label, color }) => ({
    label,
    count: applications.filter((a) => a.status === key).length,
    color,
  }));

  const donutData = pipelineData.filter((d) => d.count > 0);
  const timeData = buildTimeData(applications);

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
            <Link href="/dashboard" className="px-2.5 sm:px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
              Dashboard
            </Link>
            <Link href="/analytics" className="px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-semibold text-violet-600 bg-violet-50 dark:bg-violet-900/30 transition-colors">
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
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-2">Insights</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-slate-400 text-sm mb-6 sm:mb-8">A breakdown of your job search performance</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Applied",   value: total,              color: "text-white",        sub: "applications" },
              { label: "In Progress",     value: inProgress,         color: "text-violet-300",   sub: "active stages" },
              { label: "Response Rate",   value: `${responseRate}%`, color: "text-amber-300",    sub: "of applications" },
              { label: "Offers",          value: offers,             color: "text-emerald-300",  sub: "received" },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5">
                <p className="text-slate-400 text-xs font-medium mb-3">{label}</p>
                <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
                <p className="text-slate-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-slate-400 text-sm">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading...
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 text-2xl">📊</div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No data yet</p>
            <p className="text-sm text-slate-400">Add some applications on the dashboard to see your analytics.</p>
            <Link href="/dashboard" className="mt-4 text-sm text-violet-600 hover:underline">Go to Dashboard →</Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Row 1: Pipeline + Donut */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

              {/* Pipeline bar chart */}
              <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Application Pipeline</h2>
                <p className="text-xs text-slate-400 mb-6">How many applications are at each stage</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pipelineData} barSize={36}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                    <Tooltip
                      cursor={{ fill: "rgba(148,163,184,0.08)" }}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number | undefined) => [value ?? 0, "Applications"]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {pipelineData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Donut chart */}
              <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Status Breakdown</h2>
                <p className="text-xs text-slate-400 mb-4">Current distribution</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      dataKey="count"
                      paddingAngle={2}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number, _: string, props: { payload?: { label?: string } }) => [value, props.payload?.label ?? ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2">
                  {donutData.map((d) => (
                    <div key={d.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{d.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Applications over time */}
            {timeData.length > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Applications Over Time</h2>
                <p className="text-xs text-slate-400 mb-6">Cumulative total by week</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeData}>
                    <defs>
                      <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number | undefined) => [value ?? 0, "Total applications"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#violetGradient)"
                      dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#7c3aed" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Row 3: Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <StatCard
                label="Offer Rate"
                value={total > 0 ? `${Math.round((offers / total) * 100)}%` : "—"}
                sub={`${offers} offer${offers !== 1 ? "s" : ""} from ${total} applications`}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Interview Rate"
                value={total > 0 ? `${Math.round((applications.filter(a => ["INTERVIEW", "OFFER"].includes(a.status)).length / total) * 100)}%` : "—"}
                sub="made it to interview stage"
                color="text-violet-600 dark:text-violet-400"
              />
              <StatCard
                label="Still Active"
                value={inProgress}
                sub="applications in progress"
                color="text-amber-600 dark:text-amber-400"
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
