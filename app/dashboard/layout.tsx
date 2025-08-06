"use client"; // Diperlukan untuk hook seperti usePathname dan useRouter

import React, { useEffect, useState } from "react"; // useEffect dan useState ditambahkan
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Box,
  Tag,
  History,
  List,
  Newspaper,
  DollarSign,
  LogOut,
  Loader2, // PENAMBAHAN: Ikon untuk loading
} from "lucide-react";

// Definisikan tipe untuk item navigasi
type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

// Simpan semua item navigasi dalam sebuah array agar mudah dikelola
const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/produk", label: "Produk", icon: Box },
  { href: "/dashboard/kepingan", label: "List Kepingan", icon: List },
  { href: "/dashboard/harga", label: "Update Harga", icon: DollarSign },
  { href: "/dashboard/histori-harga", label: "Histori Harga", icon: History },
  { href: "/dashboard/histori", label: "Histori Scanner", icon: History },
  { href: "/dashboard/berita", label: "Berita", icon: Newspaper },
  { href: "/dashboard/banner", label: "Banner", icon: Newspaper },
];

// Komponen NavLink yang bisa digunakan kembali
const NavLink = ({ href, label, icon: Icon }: NavItem) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // PENAMBAHAN: State untuk memeriksa status otentikasi
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // PENAMBAHAN: Efek untuk memeriksa token saat komponen dimuat
  useEffect(() => {
    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      // Jika tidak ada token, arahkan ke halaman login
      router.push("/");
    } else {
      // Jika ada token, izinkan rendering dan hentikan pengecekan
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    router.push("/");
  };

  // PENAMBAHAN: Tampilkan layar loading selama pengecekan token
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <Tag className="h-6 w-6 text-primary" />
              <span>Silverium</span>
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
      <main className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6 sm:hidden">
          <h1 className="text-lg font-semibold">Silverium</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
