"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintLabelProps {
  transactionId: number;
}

export default function PrintLabel({ transactionId }: PrintLabelProps) {
  const handlePrint = () => {
    // Buka URL API di tab baru, browser akan otomatis handle download/print
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${transactionId}/label`
    );
  };

  return (
    <Button
      variant="outline"
      onClick={handlePrint}
      className="w-full sm:w-auto"
    >
      <Printer className="mr-2 h-4 w-4" />
      Cetak Label Pengiriman
    </Button>
  );
}
