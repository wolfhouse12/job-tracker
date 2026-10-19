"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { sendJson } from "@/lib/send-json";

const CONFIRM_WORD = "DELETE";

export function DeleteAccount() {
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await sendJson("/api/account", "DELETE");
    if (!res.ok) {
      setError(res.error);
      setDeleting(false);
      return;
    }
    // The server already deleted the user and its sessions; this clears the local session too.
    await signOut({ redirectUrl: "/" });
  }

  return (
    <section className="mb-12 rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Delete account</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Permanently deletes your account, all applications and all resumes. This can&apos;t be undone.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete account…
        </button>
      ) : (
        <div className="space-y-3">
          <label htmlFor="delete-confirm" className="block text-sm text-slate-600 dark:text-slate-300">
            Type <strong>{CONFIRM_WORD}</strong> to confirm
          </label>
          <input
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className="w-full sm:w-64 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_WORD || deleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete everything"}
            </button>
            <button
              onClick={() => { setOpen(false); setConfirmText(""); setError(null); }}
              disabled={deleting}
              className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
