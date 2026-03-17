import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell min-h-screen px-4 py-6 lg:px-6">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
