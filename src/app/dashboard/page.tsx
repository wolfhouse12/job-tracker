import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Job Tracker</h1>
        <UserButton />
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-500 mb-8">Welcome! Your user ID is: {userId}</p>

        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Offers</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">
            No applications yet. We&apos;ll add that next.
          </p>
        </div>
      </div>
    </main>
  );
}
