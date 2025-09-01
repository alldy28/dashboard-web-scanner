"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TransactionStatus from "@/app/dashboard/transactions/[id]/components/TransactionStatus";
import { Loader2 } from "lucide-react";

type Transaction = {
  transaction_id: number;
  nama_pembeli: string;
  type: "buy_digital" | "buyback" | "physical_print";
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in_transit"
    | "ready_for_pickup"
    | "completed";
  created_at: string;
};

export default function BandarTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem("bandar_access_token");
      if (!token) {
        setError(
          "Token tidak ditemukan. Silakan login kembali sebagai Bandar."
        );
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bandar/transactions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal mengambil data transaksi");
        }
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-5">
        Daftar Tugas Transaksi
      </h1>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Konsumen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.transaction_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {tx.transaction_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {tx.nama_pembeli}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    {tx.type.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <TransactionStatus status={tx.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(tx.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/bandar-dashboard/transactions/${tx.transaction_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Kelola
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Tidak ada tugas transaksi untuk Anda saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
