"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader, // Diperlukan untuk aksesibilitas
  SheetTitle, // Diperlukan untuk aksesibilitas
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  FileText,
  Tag,
  LogOut,
  Loader2,
  ShoppingCart,
  Menu, // Ikon untuk tombol hamburger
} from "lucide-react";

// Tipe untuk item navigasi
type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

// Item navigasi khusus untuk Bandar Silverium
const navItems: NavItem[] = [
  { href: "/bandar-dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/bandar-dashboard/transactions",
    label: "Tugas Transaksi",
    icon: FileText,
  },
  {
    href: "/bandar-dashboard/customers",
    label: "Daftar Pelanggan",
    icon: Users,
  },
  {
    href: "/bandar-dashboard/orders",
    label: "Order Pusat",
    icon: ShoppingCart,
  },
];

// Komponen NavLink (Bersih dari {" "})
const NavLink = ({ href, label, icon: Icon }: NavItem) => {
  const pathname = usePathname();
  const isActive =
    pathname.startsWith(href) &&
    (href !== "/bandar-dashboard" || pathname === "/bandar-dashboard");

  return (
    <Link href={href} passHref>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className="w-full justify-start gap-2"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
};

export default function BandarDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Cek token bandar di localStorage
    const token = localStorage.getItem("bandar_access_token");
    if (!token) {
      router.replace("/bandar-login"); // Arahkan ke login bandar jika tidak ada token
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("bandar_access_token");
    localStorage.removeItem("bandar_refresh_token");
    router.push("/bandar-login");
  };

  // Tampilkan loading spinner selama pengecekan token
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Cari label halaman saat ini untuk judul header mobile
  const currentPage = navItems.find((item) => pathname.startsWith(item.href));

  // Layout utama
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* 1. Sidebar Desktop (hidden di mobile) */}
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        {/* Konten navigasi untuk desktop */}
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-6">
            <Link
              href="/bandar-dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <Tag className="h-6 w-6 text-primary" />
              <span>Dashboard Bandar</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto px-4 py-2">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </nav>
          <div className="mt-auto border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* 2. Konten Utama */}
      <main className="flex-1 flex flex-col">
        {/* 3. Header Mobile (hanya tampil di mobile) */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden">
          {/* Tombol Hamburger untuk buka Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>

            {/* Konten Sheet (Menu Mobile) */}
            <SheetContent side="left" className="flex flex-col p-0 w-64">
              <div className="flex h-full max-h-screen flex-col gap-2">
                {/* PERBAIKAN AKSESIBILITAS:
                  Menggunakan <SheetHeader> dan <SheetTitle>
                */}
                <SheetHeader className="flex h-14 flex-row items-center border-b px-6">
                  <SheetTitle asChild>
                    <Link
                      href="/bandar-dashboard"
                      className="flex items-center gap-2 font-semibold"
                    >
                      <Tag className="h-6 w-6 text-primary" />
                      <span>Dashboard Bandar</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex-1 overflow-auto px-4 py-2">
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      // PERBAIKAN: Bungkus dengan <SheetClose>
                      // agar menu tertutup saat link diklik
                      <SheetClose asChild key={item.href}>
                        <NavLink {...item} />
                      </SheetClose>
                    ))}
                  </div>
                </nav>

                <div className="mt-auto border-t p-4">
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Judul Halaman di Header Mobile */}
          <h1 className="flex-1 text-lg font-semibold truncate">
            {currentPage?.label || "Dashboard Bandar"}
          </h1>
        </header>

        {/* 4. Konten Halaman (Child) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
