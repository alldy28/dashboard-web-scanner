"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, UserCheck, Clock, Shield } from "lucide-react";
import { Loader2 } from "lucide-react";

// Tipe data hasil summary
type AdminSummary = {
  pendingTransactions: number;
  totalUsers: number;
  totalBandars: number;
  totalDigitalSilver: number;
};

// Komponen untuk satu kartu statistik
const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  link,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  link?: string;
}) => (
  <div className="rounded-xl border bg-card text-card-foreground shadow">
    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
      <h3 className="tracking-tight text-sm font-medium">{title}</h3>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="p-6 pt-0">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    {link && (
      <div className="p-6 pt-0 mt-2 border-t">
        <Link href={link}>
          <Button
            variant="ghost"
            className="text-sm w-full justify-start p-0 h-auto"
          >
            Lihat Detail <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    )}
  </div>
);

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      const token = localStorage.getItem("admin_access_token");
      if (!token) {
        setError("Token tidak valid.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard-summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          throw new Error("Gagal mengambil data summary.");
        }

        const data = await res.json();
        setSummary(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Terjadi kesalahan");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard Admin</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Transaksi Pending"
          value={summary?.pendingTransactions || 0}
          icon={Clock}
          description="Permintaan menunggu persetujuan Anda"
          link="/dashboard/transactions"
        />
        <StatCard
          title="Total Konsumen"
          value={summary?.totalUsers || 0}
          icon={Users}
          description="Jumlah akun konsumen terdaftar"
        />
        <StatCard
          title="Total Bandar"
          value={summary?.totalBandars || 0}
          icon={UserCheck}
          description="Jumlah mitra bandar aktif"
          link="/dashboard/bandars"
        />
        <StatCard
          title="Total Perak Digital"
          value={`${summary?.totalDigitalSilver?.toFixed(4) || "0.0000"} gr`}
          icon={Shield}
          description="Akumulasi simpanan perak konsumen"
        />
      </div>
    </div>
  );
}
