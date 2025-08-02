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
import { apiClient } from "@/lib/api"; // PERBAIKAN: Impor apiClient

// Tipe data untuk kepingan yang diterima dari API
type Kepingan = {
  uuid_random: string;
  produk_id: number;
  tgl_produksi: string;
  kode_validasi: string;
};

interface GenerateQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  produkId: number | null;
  namaProduk: string;
  gramasiProduk: string;
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

  const WEBSITE_URL = "https://zh8r77hb-3001.asse.devtunnels.ms/verif";

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
      // PERBAIKAN: Menggunakan apiClient yang sudah menangani otentikasi
      const data = await apiClient(`/api/produk/${produkId}/generate-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jumlah }),
      });

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

  const handleDownloadZip = async () => {
    if (generatedKepingan.length === 0) return;
    setIsLoading(true);

    try {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
        now.getDate()
      )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(
        now.getSeconds()
      )}`;
      const cleanNama = namaProduk.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanGramasi = gramasiProduk.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `QR_Codes_${cleanNama}_${cleanGramasi}_${timestamp}.zip`;

      const zip = new JSZip();

      const mainCanvas = document.createElement("canvas");
      const ctx = mainCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Tidak bisa membuat canvas");
      }

      for (const kepingan of generatedKepingan) {
        if (kepingan && kepingan.uuid_random) {
          const qrContent = `${WEBSITE_URL}/${kepingan.uuid_random}`;
          const uuidSlice = kepingan.uuid_random.substring(0, 6).toUpperCase();
          const validationCode = kepingan.kode_validasi;

          const qrSize = 400;
          const padding = 30;
          const textSideWidth = 400;

          mainCanvas.width = qrSize + textSideWidth + padding * 3;
          mainCanvas.height = qrSize + padding * 2;

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

          const qrCanvas = document.createElement("canvas");
          await QRCode.toCanvas(qrCanvas, qrContent, {
            errorCorrectionLevel: "H",
            width: qrSize,
            margin: 1,
          });
          ctx.drawImage(qrCanvas, padding, padding);

          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const textCenterX = qrSize + padding * 2 + textSideWidth / 2;
          const textCenterY = mainCanvas.height / 2;

          ctx.font = "bold 80px Arial";
          ctx.fillText(validationCode, textCenterX, textCenterY - 30);

          ctx.font = "60px monospace";
          ctx.fillText(uuidSlice, textCenterX, textCenterY + 50);

          const dataUrl = mainCanvas.toDataURL("image/png");
          const blob = await (await fetch(dataUrl)).blob();

          zip.file(`qrcode_${uuidSlice}_${validationCode}.png`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, fileName);

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
                onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
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
              {generatedKepingan.length} Kode Berhasil Dibuat!
            </h4>
            <div className="max-h-48 overflow-y-auto rounded-md border p-2 text-xs font-mono">
              <div className="grid grid-cols-2 gap-x-4 font-bold border-b pb-1 mb-1">
                <span>URL Preview</span>
                <span className="text-right">Kode Validasi</span>
              </div>
              {generatedKepingan.map((k) => (
                <div
                  key={k.uuid_random}
                  className="grid grid-cols-2 gap-x-4 items-center py-1"
                >
                  <span className="truncate">
                    {`${WEBSITE_URL}/${k.uuid_random.substring(0, 8)}...`}
                  </span>
                  <span className="text-right font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    {k.kode_validasi}
                  </span>
                </div>
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
