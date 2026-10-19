import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-slate-900">
      <SignUp />
      <Link href="/privacy" className="text-xs text-slate-500 hover:underline">Privacy &amp; Cookies</Link>
    </main>
  );
}
