"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import TransactionStatus from "@/app/dashboard/transactions/[id]/components/TransactionStatus";
import BandarActions from "./components/BandarActions";

// Tipe data untuk detail transaksi bandar
type BandarTransactionDetail = {
  transaction_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  type: "buy_digital" | "buyback" | "physical_print";
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in_transit"
    | "ready_for_pickup"
    | "completed";
  amount: number;
  total_price: number | null;
  created_at: string;
};

export default function BandarDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [transaction, setTransaction] =
    useState<BandarTransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const getTransaction = async () => {
      const token = localStorage.getItem("bandar_access_token");
      if (!token) {
        router.replace("/bandar-login");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bandar/transactions/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal mengambil data");
        }
        const data = await res.json();
        setTransaction(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Terjadi kesalahan yang tidak diketahui");
        }
      } finally {
        setIsLoading(false);
      }
    };
    getTransaction();
  }, [id, router]);

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!transaction) return <p className="p-6">Transaksi tidak ditemukan.</p>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Kelola Transaksi #{transaction.transaction_id}
        </h1>
        <p className="text-sm text-gray-500">
          Dipesan oleh: {transaction.customer_name} (
          {transaction.customer_email})
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium">Detail Transaksi</h3>
        <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Status Saat Ini
            </dt>
            <dd className="mt-1">
              <TransactionStatus status={transaction.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Tipe</dt>
            <dd className="mt-1 capitalize">
              {transaction.type.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Jumlah</dt>
            <dd className="mt-1">{transaction.amount} gram</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              No. Telepon Konsumen
            </dt>
            <dd className="mt-1 font-semibold text-gray-800">
              {transaction.customer_phone || "Tidak tersedia"}
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium">Aksi Bandar</h3>
        <div className="mt-4">
          <BandarActions transaction={transaction} />
        </div>
      </div> 
    </div>
  );
}
