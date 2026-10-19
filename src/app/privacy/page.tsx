import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & Cookies · Job Tracker",
};

const SUPPORT_URL = "https://github.com/wolfhouse12/job-tracker/issues";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 py-12">
      <article className="max-w-2xl mx-auto text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-6">
        <Link href="/" className="text-violet-600 dark:text-violet-400 hover:underline">← Back to Job Tracker</Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy &amp; Cookies</h1>
        <p>
          Job Tracker is a personal portfolio project. This page explains what it stores, who it is
          shared with, and how to delete it.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">What is stored</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Your account</strong> (email, name, sign-in details), held by <a className="text-violet-600 dark:text-violet-400 hover:underline" href="https://clerk.com/legal/privacy">Clerk</a>, the sign-in provider. Passwords are never seen or stored by this app.</li>
            <li><strong>Your applications</strong>: company, role, status, notes and job descriptions you enter.</li>
            <li><strong>Your resumes</strong>: the text extracted from PDFs you upload or text you paste. The PDF file itself is not kept.</li>
          </ul>
          <p>Applications and resumes are stored in a PostgreSQL database hosted by Supabase, and only your own account can read them.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI features</h2>
          <p>
            When you click an AI tool, the application details and the resume text for that job are
            sent to <a className="text-violet-600 dark:text-violet-400 hover:underline" href="https://groq.com/privacy-policy/">Groq</a> to
            generate the response. Nothing is sent to Groq unless you use an AI tool.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cookies</h2>
          <p>
            The only cookies are the ones Clerk needs to keep you signed in. Your light/dark theme
            choice is saved in your browser&apos;s local storage. There are no analytics, advertising
            or tracking cookies, so there is nothing to opt out of.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Deleting your data</h2>
          <p>
            On the dashboard, <strong>Delete account</strong> at the bottom of the page permanently
            removes your applications, resumes and account. Individual applications and resumes can be
            deleted at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Contact</h2>
          <p>
            Questions or problems: <a className="text-violet-600 dark:text-violet-400 hover:underline" href={SUPPORT_URL}>open an issue on GitHub</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
