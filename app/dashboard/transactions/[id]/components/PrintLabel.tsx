"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

interface PrintLabelProps {
  transactionId: number;
}

export default function PrintLabel({ transactionId }: PrintLabelProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("admin_access_token");

    if (!token) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Panggil API dengan header otentikasi
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${transactionId}/label`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengunduh file label.");
      }

      // 2. Ubah respons menjadi file (blob)
      const blob = await res.blob();

      // 3. Buat URL sementara untuk file tersebut di browser
      const fileURL = window.URL.createObjectURL(blob);

      // 4. Buka URL sementara itu di tab baru untuk preview
      window.open(fileURL, "_blank");
    } catch (error) {
      console.error("Error saat mencetak label:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Gagal membuat label. Lihat console untuk detail."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handlePrint}
      disabled={isLoading}
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      Cetak Label Pengiriman
    </Button>
  );
}
