"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Box,
  Tag,
  History,
  List,
  Newspaper,
  Boxes,
  ImageIcon,
  DollarSign,
  LogOut,
  Loader2,
  FileText,
  Users,
  Menu,
  QrCode,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: FileText },
  { href: "/dashboard/produk", label: "Produk", icon: Box },
  { href: "/dashboard/kepingan", label: "List Kepingan", icon: List },
  {
    href: "/dashboard/tambah-id-produk",
    label: "Tambah Kepingan",
    icon: QrCode,
  },
  { href: "/dashboard/konfirmasi-produk", label: "Proses Barang", icon: Boxes },
  { href: "/dashboard/harga", label: "Update Harga", icon: DollarSign },
  { href: "/dashboard/histori-harga", label: "Histori Harga", icon: History },
  { href: "/dashboard/histori", label: "Histori Scanner", icon: History },
  { href: "/dashboard/berita", label: "Berita", icon: Newspaper },
  { href: "/dashboard/banner", label: "Banner", icon: ImageIcon },
  { href: "/dashboard/bandars", label: "Manajemen Bandar", icon: Users },
  { href: "/dashboard/users", label: "Manajemen Pengguna", icon: Users },
];

const NavLink = ({ href, label, icon: Icon }: NavItem) => {
  const pathname = usePathname();
  const isActive =
    pathname.startsWith(href) &&
    (href !== "/dashboard" || pathname === "/dashboard");

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      router.replace("/");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    router.push("/");
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
            >
              <Tag className="h-6 w-6 text-primary" />
              <span>Silverium Admin</span>
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
        {/* Header Mobile dengan Hamburger Menu */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-64">
              <div className="flex h-full max-h-screen flex-col gap-2">
                <SheetHeader className="flex h-14 flex-row items-center border-b px-6">
                  <SheetTitle asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 font-semibold"
                    >
                      <Tag className="h-6 w-6 text-primary" />
                      <span>Silverium Admin</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-auto px-4 py-2">
                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
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
          <h1 className="flex-1 text-lg font-semibold truncate">
            Silverium Admin
          </h1>
        </header>

        {/* Konten Halaman */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
