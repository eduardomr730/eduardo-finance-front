import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell min-h-screen px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      <div className="mx-auto grid max-w-[1600px] gap-4 lg:gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main className="min-w-0 space-y-4 lg:space-y-6">{children}</main>
      </div>
    </div>
  );
}
