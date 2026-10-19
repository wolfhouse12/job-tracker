import { NextRequest } from "next/server";

export const STATUSES = ["APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED"] as const;
export type Status = (typeof STATUSES)[number];

const LIMITS = {
  company: 200,
  role: 200,
  jobDescription: 20_000,
  notes: 5_000,
} as const;

export type ApplicationInput = {
  company?: string;
  role?: string;
  status?: Status;
  jobDescription?: string | null;
  notes?: string | null;
  resumeId?: string | null;
};

/** Parses a JSON body, returning null instead of throwing on malformed input. */
export async function readJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

/**
 * Checks the fields of a create (partial = false) or update (partial = true) request.
 * Only known fields are copied, so the client can't set userId or other columns.
 */
export function parseApplicationInput(
  body: Record<string, unknown>,
  partial: boolean
): { data: ApplicationInput } | { error: string } {
  const data: ApplicationInput = {};

  for (const field of ["company", "role"] as const) {
    const value = body[field];
    if (value === undefined && partial) continue;
    if (typeof value !== "string" || !value.trim()) return { error: "Company and role are required" };
    if (value.length > LIMITS[field]) return { error: `${field} is too long` };
    data[field] = value.trim();
  }

  for (const field of ["jobDescription", "notes"] as const) {
    const value = body[field];
    if (value === undefined) continue;
    if (value !== null && typeof value !== "string") return { error: `${field} must be text` };
    if (typeof value === "string" && value.length > LIMITS[field]) return { error: `${field} is too long` };
    data[field] = value ? value : null;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as Status)) return { error: "Invalid status" };
    data.status = body.status as Status;
  }

  if (body.resumeId !== undefined) {
    if (body.resumeId !== null && typeof body.resumeId !== "string") return { error: "Invalid resume" };
    data.resumeId = body.resumeId || null;
  }

  return { data };
}
