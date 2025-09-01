"use client"; // Menandakan ini adalah Client Component

import { useEffect, useState } from "react";
import Link from "next/link";
import TransactionStatus from "./[id]/components/TransactionStatus"; // Komponen status tetap berguna
import { Loader2 } from "lucide-react"; // Untuk loading indicator

// Definisikan tipe data untuk transaksi
type Transaction = {
  transaction_id: number;
  customer_name: string;
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

export default function TransactionsPage() {
  // State untuk menyimpan data, status loading, dan error
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fungsi untuk mengambil data
    const fetchTransactions = async () => {
      // Ambil token dari localStorage
      const token = localStorage.getItem("admin_access_token");

      if (!token) {
        setError("Token tidak ditemukan, silakan login kembali.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `https://apiv2.silverium.id/api/admin/transactions`,
          {
            headers: {
              // Tambahkan token ke header Authorization
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Gagal mengambil data transaksi");
        }

        const data = await res.json();
        setTransactions(data);
      } catch (err){
        if(err instanceof Error) {
            setError(err.message);
        }else {
            setError('terjadi error tidak dikatehui')
        }
      }
      finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []); // Jalankan sekali saat komponen dimuat

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
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-5">
        Manajemen Transaksi
      </h1>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {/* ... (Header tabel sama seperti sebelumnya) ... */}
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Konsumen
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tipe
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tanggal
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.transaction_id}>
                  {/* ... (Isi baris tabel sama seperti sebelumnya) ... */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {tx.transaction_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {tx.customer_name}
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
                      href={`/dashboard/transactions/${tx.transaction_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Tidak ada data transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
