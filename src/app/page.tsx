import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Track Every Application",
    desc: "Table and Kanban views to manage your pipeline across every stage — Applied, Phone Screen, Interview, Offer.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "AI-Powered Tools",
    desc: "Generate cover letters, prep for interviews, write follow-up emails, and get resume feedback — all tailored to each role.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Analytics & Insights",
    desc: "See your response rate, offer rate, and how your search is progressing over time — all in one place.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">

      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold tracking-tight">JT</span>
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Job Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 px-6 pt-20 pb-28 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block text-violet-400 text-xs font-semibold uppercase tracking-widest mb-5 px-3 py-1 rounded-full bg-violet-400/10 border border-violet-400/20">
            AI-Powered Job Search
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Your job search,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">
              finally organised
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed">
            Track every application, generate cover letters in seconds, and understand your pipeline — so you can focus on landing the job, not managing spreadsheets.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard"
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-7 py-3.5 text-white font-semibold text-sm shadow-lg shadow-violet-900/40 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/sign-in"
              className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-7 py-3.5 text-white font-semibold text-sm backdrop-blur-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 -mt-6 sm:-mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">{title}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-8 sm:mb-10">How it works</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
          {[
            { step: "1", label: "Create an account", sub: "Sign up with your email in seconds" },
            { step: "2", label: "Upload your resume", sub: "AI uses it to personalise everything" },
            { step: "3", label: "Add applications", sub: "Log jobs as you apply to them" },
            { step: "4", label: "Let AI help", sub: "Cover letters, prep, follow-ups — done" },
          ].map(({ step, label, sub }) => (
            <div key={step} className="text-center">
              <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold text-sm flex items-center justify-center mx-auto mb-3">
                {step}
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA banner */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-10 text-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to get organised?</h2>
          <p className="text-violet-200 text-sm mb-7">It takes less than a minute to get started.</p>
          <Link
            href="/dashboard"
            className="inline-block rounded-xl bg-white text-violet-700 font-semibold text-sm px-8 py-3.5 hover:bg-violet-50 transition-colors shadow-sm"
          >
            Start Tracking for Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-6 text-center mt-auto">
        <p className="text-xs text-slate-400">Built with Next.js · Supabase · Clerk · Groq AI</p>
      </footer>

    </div>
  );
}
