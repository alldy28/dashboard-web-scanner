"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, PackageCheck } from "lucide-react";

type Transaction = {
  transaction_id: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in_transit"
    | "ready_for_pickup"
    | "completed";
};

export default function BandarActions({
  transaction,
}: {
  transaction: Transaction;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "receive" | "complete") => {
    setIsLoading(action);
    setError(null);
    const token = localStorage.getItem("bandar_access_token");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bandar/transactions/${transaction.transaction_id}/${action}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Aksi gagal dilakukan");
      }

      alert("Status transaksi berhasil diperbarui!");
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui");
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {(transaction.status === "approved" ||
        transaction.status === "in_transit") && (
        <Button
          onClick={() => handleAction("receive")}
          disabled={!!isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading === "receive" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="mr-2 h-4 w-4" />
          )}
          Konfirmasi Barang Diterima
        </Button>
      )}
      {transaction.status === "ready_for_pickup" && (
        <Button
          onClick={() => handleAction("complete")}
          disabled={!!isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading === "complete" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Selesaikan Transaksi (Barang Diambil)
        </Button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {transaction.status !== "approved" &&
        transaction.status !== "in_transit" &&
        transaction.status !== "ready_for_pickup" && (
          // --- PERBAIKAN DI SINI ---
          <p className="text-sm text-gray-500">
            Tidak ada aksi yang diperlukan untuk status &apos;
            {transaction.status}&apos;.
          </p>
        )}
    </div>
  );
}
