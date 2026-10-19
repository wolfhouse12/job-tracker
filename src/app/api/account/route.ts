import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Deletes everything stored for the signed-in user, then the Clerk account itself, which also
 * ends all of the user's sessions on Clerk's side. The data goes first: if deleting the
 * account fails, the user can retry, and nothing is left behind without an owner.
 */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.$transaction([
    prisma.application.deleteMany({ where: { userId } }),
    prisma.resume.deleteMany({ where: { userId } }),
  ]);

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (err) {
    console.error("[account delete error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Your data was deleted, but the account could not be closed. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
