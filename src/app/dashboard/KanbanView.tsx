"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: string;
  notes: string | null;
  jobDescription: string | null;
};

type AiFeature = "cover-letter" | "interview-prep" | "follow-up";

const COLUMNS = [
  { key: "APPLIED",      label: "Applied",      dot: "bg-blue-400",    header: "bg-blue-50 border-blue-100",      count: "bg-blue-100 text-blue-600" },
  { key: "PHONE_SCREEN", label: "Phone Screen", dot: "bg-amber-400",   header: "bg-amber-50 border-amber-100",    count: "bg-amber-100 text-amber-600" },
  { key: "INTERVIEW",    label: "Interview",    dot: "bg-violet-400",  header: "bg-violet-50 border-violet-100",  count: "bg-violet-100 text-violet-600" },
  { key: "OFFER",        label: "Offer",        dot: "bg-emerald-400", header: "bg-emerald-50 border-emerald-100",count: "bg-emerald-100 text-emerald-600" },
  { key: "REJECTED",     label: "Rejected",     dot: "bg-red-400",     header: "bg-red-50 border-red-100",        count: "bg-red-100 text-red-500" },
] as const;

const AI_FEATURES = [
  { key: "cover-letter"  as AiFeature, label: "Cover Letter",   icon: "📝" },
  { key: "interview-prep"as AiFeature, label: "Interview Prep", icon: "🎯" },
  { key: "follow-up"     as AiFeature, label: "Follow-up Email",icon: "✉️" },
];

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

type Props = {
  applications: Application[];
  onStatusChange: (id: string, status: string) => void;
  onEdit: (id: string, data: { company: string; role: string; jobDescription: string; notes: string }) => void;
  onDelete: (id: string) => void;
};

export function KanbanView({ applications, onStatusChange, onEdit, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: "edit" | "ai"; app: Application } | null>(null);
  const [editForm, setEditForm] = useState({ company: "", role: "", jobDescription: "", notes: "" });
  const [aiFeature, setAiFeature] = useState<AiFeature | null>(null);
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function openEdit(app: Application) {
    setEditForm({
      company: app.company,
      role: app.role,
      jobDescription: app.jobDescription ?? "",
      notes: app.notes ?? "",
    });
    setModal({ type: "edit", app });
  }

  function openAi(app: Application) {
    setAiFeature(null);
    setAiContent(null);
    setModal({ type: "ai", app });
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    await fetch(`/api/applications/${modal.app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    onEdit(modal.app.id, editForm);
    setModal(null);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    onDelete(id);
    setDeletingId(null);
  }

  async function generateAi(feature: AiFeature) {
    if (!modal) return;
    setAiFeature(feature);
    setAiContent(null);
    setAiLoading(true);
    const res = await fetch(`/api/applications/${modal.app.id}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature }),
    });
    const data = await res.json();
    setAiContent(data.content ?? data.error ?? "Something went wrong.");
    setAiLoading(false);
  }

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    onStatusChange(draggableId, destination.droppableId);
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-8">
          {COLUMNS.map(({ key, label, dot, header, count }) => {
            const cards = applications.filter((a) => a.status === key);
            return (
              <div key={key} className="flex-shrink-0 w-60">
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 mb-3 ${header}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </div>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${count}`}>{cards.length}</span>
                </div>

                <Droppable droppableId={key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-24 rounded-xl transition-colors p-1 ${
                        snapshot.isDraggingOver ? "bg-violet-50 ring-2 ring-violet-200 ring-dashed" : ""
                      }`}
                    >
                      {cards.map((app, index) => (
                        <Draggable key={app.id} draggableId={app.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border border-slate-200 p-4 mb-2 select-none transition-shadow group ${
                                snapshot.isDragging ? "shadow-xl border-violet-300 rotate-1" : "shadow-sm hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className={`w-8 h-8 rounded-lg ${avatarColor(app.company)} flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-white text-xs font-bold">{app.company[0].toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{app.company}</p>
                                  <p className="text-xs text-slate-400 truncate">{app.role}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-400">{timeAgo(app.appliedAt)}</span>
                                {app.notes && <span className="text-xs text-slate-300" title={app.notes}>📝</span>}
                              </div>

                              {/* Action buttons — visible on hover */}
                              {deletingId === app.id ? (
                                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                                  <span className="text-xs text-slate-400 mr-1">Delete?</span>
                                  <button
                                    onClick={() => handleDelete(app.id)}
                                    className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeletingId(null)}
                                    className="rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEdit(app)}
                                    title="Edit"
                                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setDeletingId(app.id)}
                                    title="Delete"
                                    className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => openAi(app)}
                                    className="ml-auto rounded-lg px-2.5 py-1 text-xs font-semibold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
                                  >
                                    ✨ AI
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-slate-200">
                          <p className="text-xs text-slate-300">Drop here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-medium">{modal.app.company} · {modal.app.role}</p>
                <h2 className="font-semibold text-slate-900">
                  {modal.type === "edit" ? "Edit Application" : "✨ AI Assistant"}
                </h2>
              </div>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {modal.type === "edit" ? (
                <form onSubmit={handleEdit}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Company *</label>
                      <input
                        required
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Role *</label>
                      <input
                        required
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Job Description</label>
                    <textarea
                      value={editForm.jobDescription}
                      onChange={(e) => setEditForm({ ...editForm, jobDescription: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-xl bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-white text-sm font-semibold transition-colors">
                      Save Changes
                    </button>
                    <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex gap-2 mb-4">
                    {AI_FEATURES.map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => generateAi(key)}
                        disabled={aiLoading}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                          aiFeature === key
                            ? "bg-violet-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <span>{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  {aiLoading && (
                    <div className="flex items-center gap-2 text-violet-500 text-sm py-4">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Generating with AI...
                    </div>
                  )}

                  {aiContent && !aiLoading && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiContent);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                        >
                          {copied ? (
                            <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                          ) : (
                            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{aiContent}</pre>
                    </div>
                  )}

                  {!aiFeature && !aiLoading && (
                    <p className="text-sm text-slate-400">Select a tool above to generate content.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
