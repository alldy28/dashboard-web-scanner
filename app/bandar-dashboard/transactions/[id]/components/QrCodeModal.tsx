"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react"; // Impor dari library

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
}

export default function QrCodeModal({
  isOpen,
  onClose,
  transactionId,
}: QrCodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>QR Code Pengambilan</DialogTitle>
          <DialogDescription>
            Minta konsumen untuk memindai QR Code ini menggunakan fitur
            &quot;Konfirmasi Pengambilan&quot; di aplikasi mereka.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          {/* Tampilkan QR Code */}
          <QRCodeSVG
            value={transactionId.toString()}
            size={200} // Ukuran QR code
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"L"}
            includeMargin={false}
          />
        </div>
        <div className="text-center text-sm text-gray-500">
          ID Transaksi: #{transactionId}
        </div>
      </DialogContent>
    </Dialog>
  );
}
