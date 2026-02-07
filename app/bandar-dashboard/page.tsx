"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Users, Package, Archive } from "lucide-react";
import { Loader2 } from "lucide-react";

// PERBAIKAN 1: Buat tipe data yang spesifik untuk transaksi bandar
type BandarTransaction = {
  status:
    | "approved"
    | "in_transit"
    | "ready_for_pickup"
    | "completed"
    | "pending"
    | "rejected";
  // Tambahkan properti lain jika Anda butuh di masa depan
};

// Tipe data untuk menampung hasil summary
type BandarSummary = {
  customerCount: number;
  totalSilver: number;
  newTasks: number;
  readyForPickup: number;
};

export default function BandarDashboardPage() {
  const [summary, setSummary] = useState<BandarSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      const token = localStorage.getItem("bandar_access_token");
      if (!token) {
        setError("Token tidak valid.");
        setIsLoading(false);
        return;
      }

      try {
        const [summaryRes, transactionsRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/bandar/customers-summary`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bandar/transactions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!summaryRes.ok || !transactionsRes.ok) {
          throw new Error("Gagal mengambil data summary untuk bandar.");
        }

        const summaryData = await summaryRes.json();
        // PERBAIKAN 1: Beri tahu TypeScript tipe data dari hasil JSON
        const transactionsData: BandarTransaction[] =
          await transactionsRes.json();

        // Hitung statistik dari data transaksi
        const newTasks = transactionsData.filter(
          // PERBAIKAN 1: Gunakan tipe BandarTransaction, bukan 'any'
          (tx: BandarTransaction) =>
            tx.status === "approved" || tx.status === "in_transit"
        ).length;

        const readyForPickup = transactionsData.filter(
          // PERBAIKAN 1: Gunakan tipe BandarTransaction, bukan 'any'
          (tx: BandarTransaction) => tx.status === "ready_for_pickup"
        ).length;

        setSummary({
          customerCount: summaryData.customer_list.length,
          totalSilver: summaryData.total_digital_silver_in_region,
          newTasks: newTasks,
          readyForPickup: readyForPickup,
        });
      } catch (err) {
        // PERBAIKAN 2: Gunakan penanganan error yang aman
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Terjadi kesalahan yang tidak diketahui");
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
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard Bandar</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Tugas Baru */}
        {/* <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Tugas Baru</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{summary?.newTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Transaksi menunggu konfirmasi penerimaan
            </p>
          </div>
        </div> */}

        {/* Card Siap Diambil */}
        {/* <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">
              Siap Diambil Konsumen
            </h3>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {summary?.readyForPickup || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Barang menunggu diambil oleh konsumen
            </p>
          </div>
        </div> */}

        {/* Card Jumlah Konsumen */}
        {/* <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">
              Konsumen di Wilayah Anda
            </h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {summary?.customerCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total konsumen yang terdaftar
            </p>
          </div>
        </div> */}

        {/* Card Total Perak Digital */}
        {/* <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">
              Total Perak Digital di Wilayah
            </h3>
            <div className="h-4 w-4 text-muted-foreground font-bold">gr</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {summary?.totalSilver?.toFixed(4) || "0.0000"}
            </div>
            <p className="text-xs text-muted-foreground">
              Akumulasi simpanan perak konsumen
            </p>
          </div>
        </div> */}
      </div>

      <div className="pt-4">
        <Link href="/bandar-dashboard/orders">
          <Button>
            Lihat Semua Tugas Transaksi{" "}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
