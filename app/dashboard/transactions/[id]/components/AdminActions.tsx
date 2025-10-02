"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Send } from "lucide-react";

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

export default function AdminActions({
  transaction,
}: {
  transaction: Transaction;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject" | "ship") => {
    setIsLoading(action);
    setError(null);
    const token = localStorage.getItem("admin_access_token");

    // URL API disesuaikan berdasarkan aksi
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${
      action === "ship"
        ? transaction.transaction_id + "/ship"
        : action + "/" + transaction.transaction_id
    }`;

    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Aksi ${action} gagal.`);
      }

      alert(
        `Transaksi berhasil di-${
          action === "ship"
            ? "tandai terkirim"
            : action === "approve"
            ? "setujui"
            : "tolak"
        }!`
      );
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan");
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tombol Approve & Reject */}
      {transaction.status === "pending" && (
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
      )}

      {/* Tombol Tandai Telah Dikirim */}
      {transaction.status === "approved" && (
        <Button onClick={() => handleAction("ship")} disabled={!!isLoading}>
          {isLoading === "ship" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Tandai Telah Dikirim ke Bandar
        </Button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
