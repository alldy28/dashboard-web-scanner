"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, PackageCheck, MessageSquare, QrCode } from "lucide-react";
import QrCodeModal from "./QrCodeModal"; // Impor komponen modal baru

// Tipe data diperbarui untuk menyertakan detail konsumen
type Transaction = {
  transaction_id: number;
  type: "buy_digital" | "buyback" | "physical_print";
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in_transit"
    | "ready_for_pickup"
    | "completed";
  customer_name: string;
  customer_phone: string | null;
};

export default function BandarActions({
  transaction,
}: {
  transaction: Transaction;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State baru untuk mengontrol modal QR code
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleReceive = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("bandar_access_token");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bandar/transactions/${transaction.transaction_id}/receive`,
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
        setError("Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactConsumer = () => {
    if (!transaction.customer_phone) {
      alert("Nomor telepon konsumen tidak tersedia.");
      return;
    }
    let phoneNumber = transaction.customer_phone
      .replace(/\s+/g, "")
      .replace("+", "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "62" + phoneNumber.substring(1);
    }
    const message = `Halo Sdr/i ${transaction.customer_name},\n\nPesanan perak fisik Anda (ID: #${transaction.transaction_id}) sudah siap diambil di lokasi kami.\n\nMohon konfirmasi waktu pengambilan Anda. Terima kasih.\n\nSalam,\nBandar Silverium`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  if (transaction.type !== "physical_print") {
    return (
      <p className="text-sm text-gray-500">
        Tidak ada aksi yang diperlukan untuk transaksi digital ini.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Tombol Terima Barang */}
        {(transaction.status === "approved" ||
          transaction.status === "in_transit") && (
          <div>
            <Button
              onClick={handleReceive}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="mr-2 h-4 w-4" />
              )}
              Konfirmasi Barang Diterima
            </Button>
          </div>
        )}

        {/* Status Menunggu Pengambilan & Tombol Aksi */}
        {transaction.status === "ready_for_pickup" && (
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-grow">
              <p className="text-sm font-medium text-green-700">
                Menunggu Pengambilan oleh Konsumen.
              </p>
              <p className="text-xs text-gray-500">
                Minta konsumen untuk memindai QR Code untuk verifikasi.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Button
                onClick={() => setIsQrModalOpen(true)}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Tampilkan QR
              </Button>
              <Button
                onClick={handleContactConsumer}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Hubungi (WA)
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {/* Pesan untuk status lain */}
        {transaction.status !== "approved" &&
          transaction.status !== "in_transit" &&
          transaction.status !== "ready_for_pickup" && (
            <p className="text-sm text-gray-500">
              Tidak ada aksi yang diperlukan untuk status &apos;
              {transaction.status}&apos;.
            </p>
          )}
      </div>

      {/* Render Modal QR Code */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        transactionId={transaction.transaction_id}
      />
    </>
  );
}
