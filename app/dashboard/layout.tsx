import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children, // akan menjadi konten halaman (page.tsx)
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-64 flex-col border-r bg-gray-100/40 p-4">
        <h2 className="mb-4 text-xl font-bold">Dinar Dirham</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/produk">
            <Button variant="ghost" className="w-full justify-start">
              Produk
            </Button>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
