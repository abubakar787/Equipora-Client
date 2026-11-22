import ProtectedRoute from "@/components/providers/protected-route";

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <main className="min-h-screen bg-[#F7F9FC] p-8">
        <h1 className="text-3xl font-bold text-[#101D2C]">
          Customer Dashboard
        </h1>
        <p className="mt-2 text-slate-500">
          Welcome to your EQUIPORA account.
        </p>
      </main>
    </ProtectedRoute>
  );
}