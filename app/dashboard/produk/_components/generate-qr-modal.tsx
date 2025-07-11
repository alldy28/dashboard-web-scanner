"use client";

import { useState } from "react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Tipe data untuk kepingan yang diterima dari API
type Kepingan = {
  uuid_random: string;
  produk_id: number;
  tgl_produksi: string;
};

interface GenerateQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  produkId: number | null;
  namaProduk: string;
  gramasiProduk: string; // <-- TERIMA PROP BARU
}

export function GenerateQrModal({
  isOpen,
  onClose,
  onSuccess,
  produkId,
  namaProduk,
  gramasiProduk,
}: GenerateQrModalProps) {
  const [jumlah, setJumlah] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedKepingan, setGeneratedKepingan] = useState<Kepingan[]>([]);

  const handleClose = () => {
    setGeneratedKepingan([]);
    setJumlah(1);
    setError(null);
    onClose();
  };

  const handleGenerate = async () => {
    if (!produkId || jumlah <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedKepingan([]);

    try {
      const response = await fetch(
        `http://localhost:3000/api/produk/${produkId}/generate-qr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jumlah }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat QR code.");
      setGeneratedKepingan(data.kepingan);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan tidak diketahui."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ====================================================================
  // FUNGSI INI KITA UBAH SECARA SIGNIFIKAN
  // ====================================================================
  const handleDownloadZip = async () => {
    if (generatedKepingan.length === 0) return;
    setIsLoading(true);

    try {
      // 1. Membuat format waktu YYYYMMDD_HHMMSS
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(
        now.getSeconds()
      )}`;

      // 2. Membersihkan nama produk dan gramasi untuk nama file
      const cleanNama = namaProduk.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanGramasi = gramasiProduk.replace(/[^a-zA-Z0-9]/g, "_");

      // 3. Membuat nama file ZIP yang baru dan deskriptif
      const fileName = `QR_Codes_${cleanNama}_${cleanGramasi}_${timestamp}.zip`;

      const zip = new JSZip();
      for (const kepingan of generatedKepingan) {
        const qrCodeDataURL = await QRCode.toDataURL(kepingan.uuid_random, {
          errorCorrectionLevel: "H",
          width: 512,
        });
        const blob = await (await fetch(qrCodeDataURL)).blob();
        zip.file(`${kepingan.uuid_random}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, fileName); // 4. Gunakan nama file baru

      onSuccess();
      handleClose();
    } catch (err) {
      setError("Gagal membuat file ZIP.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Buat QR Code untuk &quot;{namaProduk} - {gramasiProduk}&quot;
          </DialogTitle>
          <DialogDescription>
            Masukkan jumlah QR code unik yang ingin Anda buat untuk produk ini.
          </DialogDescription>
        </DialogHeader>
        {/* ... sisa dari JSX tidak berubah ... */}
        {generatedKepingan.length === 0 ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jumlah" className="text-right">
                Jumlah
              </Label>
              <Input
                id="jumlah"
                type="number"
                min="1"
                max="100"
                value={jumlah}
                onChange={(e) => setJumlah(parseInt(e.target.value))}
                className="col-span-3"
              />
            </div>
            {error && (
              <p className="col-span-4 text-center text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="py-4">
            <h4 className="font-semibold mb-2">
              {generatedKepingan.length} QR Code Berhasil Dibuat!
            </h4>
            <div className="max-h-40 overflow-y-auto rounded-md border p-2 text-xs font-mono">
              {generatedKepingan.map((k) => (
                <div key={k.uuid_random}>{k.uuid_random}</div>
              ))}
            </div>
            {error && (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            )}
          </div>
        )}
        <DialogFooter>
          {generatedKepingan.length === 0 ? (
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? "Membuat..." : "Buat Sekarang"}
            </Button>
          ) : (
            <Button
              onClick={handleDownloadZip}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading
                ? "Menyiapkan ZIP..."
                : `Download ${generatedKepingan.length} QR Code (ZIP)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
