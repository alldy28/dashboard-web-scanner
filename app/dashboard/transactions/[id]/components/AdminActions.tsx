"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type TransactionDetail = {
  transaction_id: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in_transit"
    | "ready_for_pickup"
    | "completed";
};

interface AdminActionsProps {
  transaction: TransactionDetail;
}

export default function AdminActions({ transaction }: AdminActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setIsLoading(action);
    setError(null);

    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      setError("Autentikasi gagal. Silakan login kembali.");
      setIsLoading(null);
      return;
    }

    try {
      // Perhatikan URL API di sini, saya ubah agar lebih konsisten
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${action}/${transaction.transaction_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Gagal untuk ${action} transaksi.`);
      }

      alert(
        `Transaksi berhasil di-${action === "approve" ? "setujui" : "tolak"}!`
      );
      router.refresh();
    } catch (err) {
      // --- PERBAIKAN 1: Menghapus tipe 'any' ---
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi error yang tidak diketahui");
      }
    } finally {
      setIsLoading(null);
    }
  };

  if (transaction.status === "pending") {
    return (
      <div>
        <div className="flex space-x-3">
          <Button
            onClick={() => handleAction("approve")}
            disabled={!!isLoading}
          >
            {isLoading === "approve" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAction("reject")}
            disabled={!!isLoading}
          >
            {isLoading === "reject" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // --- PERBAIKAN 2: Mengganti tanda kutip dengan &apos; ---
  return (
    <p className="text-sm text-gray-500">
      Tidak ada aksi yang tersedia untuk status &apos;{transaction.status}
      &apos;.
    </p>
  );
}
