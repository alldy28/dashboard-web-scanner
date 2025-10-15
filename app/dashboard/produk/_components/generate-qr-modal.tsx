"use client";

import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiClient } from "@/lib/api";
import Image from "next/image";

// --- Tipe Data ---
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
  seriesProduk: string;
  fineness: string;
}

// --- Konfigurasi Template untuk Silver Bullion ---
const templates = {
  small: {
    url: "https://apiv2.silverium.id/uploads/template_kecil.png",
    qrX: 213,
    qrY: 190,
    qrSize: 230,
    staticText: "Silver Bar",
    staticTextX: 450,
    staticTextY: 532,
    weightX: 430,
    weightY: 502,
    finenessX: 430,
    finenessY: 565,
    textX: 330,
    textY: 620,
    font1: "bold 30px Arial",
    font2: "30px monospace",
    font3: "25px Arial",
    font4: "25px Arial",
  },
  medium: {
    url: "https://apiv2.silverium.id/uploads/template_sedang.png",
    qrX: 250,
    qrY: 233,
    qrSize: 270,
    staticText: "Silver Bar",
    staticTextX: 518,
    staticTextY: 638,
    weightX: 490,
    weightY: 602,
    finenessX: 490,
    finenessY: 675,
    textX: 400,
    textY: 750,
    font1: "bold 35px Arial",
    font2: "35px monospace",
    font3: "30px Arial",
    font4: "30px Arial",
  },
  large: {
    url: "https://apiv2.silverium.id/uploads/template_besar.png",
    qrX: 285,
    qrY: 315,
    qrSize: 320,
    staticText: "Silver Bar",
    staticTextX: 620,
    staticTextY: 785,
    weightX: 590,
    weightY: 745,
    finenessX: 590,
    finenessY: 825,
    textX: 465,
    textY: 930,
    font1: "bold 40px Arial",
    font2: "40px monospace",
    font3: "35px Arial",
    font4: "35px Arial",
  },
};

type TemplateKey = keyof typeof templates;

export function GenerateQrModal({
  isOpen,
  onClose,
  onSuccess,
  produkId,
  namaProduk,
  gramasiProduk,
  seriesProduk,
  fineness,
}: GenerateQrModalProps) {
  const [jumlah, setJumlah] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewKepingan, setPreviewKepingan] = useState<Kepingan[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateKey>("medium");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isCustomSeries = seriesProduk === "Silver Custom";
  const isBullionSeries = seriesProduk === "Silver Bullion";

  const WEBSITE_URL = "https://app.silverium.id/verif";

  useEffect(() => {
    if (isOpen) {
      setPreviewKepingan([]);
      setPreviewImage(null);
      setJumlah(1);
      setError(null);
    }
  }, [isOpen]);

  const handlePreview = async () => {
    if (!produkId || jumlah <= 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient(`/api/admin/produk/${produkId}/preview-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumlah }),
      });
      const kepinganList = data.kepingan || [];
      setPreviewKepingan(kepinganList);

      if (isBullionSeries && kepinganList.length > 0) {
        const firstKepingan = kepinganList[0];
        const template = templates[selectedTemplate];
        const qrContent = `${WEBSITE_URL}/${firstKepingan.uuid_random}`;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const templateImg = new window.Image();
        templateImg.crossOrigin = "Anonymous";
        const qrImg = new window.Image();
        qrImg.src = await QRCode.toDataURL(qrContent, {
          width: template.qrSize,
          margin: 1,
        });

        await new Promise((resolve, reject) => {
          templateImg.onload = resolve;
          templateImg.onerror = reject;
          templateImg.src = template.url;
        });

        canvas.width = templateImg.width;
        canvas.height = templateImg.height;
        ctx.drawImage(templateImg, 0, 0);
        ctx.drawImage(qrImg, template.qrX, template.qrY);

        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = template.font4;
        ctx.fillText(
          template.staticText,
          template.staticTextX,
          template.staticTextY
        );

        ctx.font = template.font3;
        ctx.fillText(`${gramasiProduk}`, template.weightX, template.weightY);
        ctx.fillText(`${fineness}`, template.finenessX, template.finenessY);

        ctx.font = template.font1;
        ctx.fillText(
          firstKepingan.kode_validasi,
          template.textX,
          template.textY
        );

        ctx.font = template.font2;
        ctx.fillText(
          firstKepingan.uuid_random.substring(0, 6).toUpperCase(),
          template.textX,
          template.textY + 40
        );

        setPreviewImage(canvas.toDataURL("image/png"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pratinjau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (previewKepingan.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      await apiClient("/api/admin/produk/save-kepingan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kepinganList: previewKepingan }),
      });

      const zip = new JSZip();
      const logoImg = new window.Image();
      logoImg.crossOrigin = "Anonymous";
      logoImg.src = "/logoSilverium.png";
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      for (const kepingan of previewKepingan) {
        const qrContent = `${WEBSITE_URL}/${kepingan.uuid_random}`;
        const uuidSlice = kepingan.uuid_random.substring(0, 6).toUpperCase();
        const validationCode = kepingan.kode_validasi;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, qrContent, {
          width: 400,
          margin: 1,
          errorCorrectionLevel: "H",
        });

        canvas.width = 370;
        canvas.height = 200;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(qrCanvas, 10, 10, 180, 180);

        const logoSize = 150;
        const logoX = 190 + (180 - logoSize) / 2;
        const logoY = -50 + (180 - logoSize) / 2;
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

        ctx.fillStyle = "black";
        ctx.font = "bold 35px Arial";
        ctx.fillText(validationCode, 220, 120);
        ctx.font = "30px monospace";
        ctx.fillText(uuidSlice, 220, 160);

        const dataUrl = canvas.toDataURL("image/png");
        const blob = await (await fetch(dataUrl)).blob();
        zip.file(`qrcode_${uuidSlice}_${validationCode}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const cleanNama = namaProduk.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanGramasi = gramasiProduk.replace(/[^a-zA-Z0-9]/g, "_");
      saveAs(zipBlob, `QR_Codes_${cleanNama}_${cleanGramasi}.zip`);

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan atau mengunduh."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCustomQR = async () => {
    if (!produkId) return;
    setIsLoading(true);
    try {
      const qrContent = `${WEBSITE_URL}/product/${produkId}`;
      const dataUrl = await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: "H",
        width: 512,
        margin: 2,
      });
      saveAs(
        dataUrl,
        `QR_Code_Custom_${namaProduk.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}${gramasiProduk.replace(/[^a-zA-Z0-9]/g, "_")}.png`
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError("Gagal membuat QR code.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndDownloadTemplatedZip = async () => {
    if (previewKepingan.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      await apiClient("/api/admin/produk/save-kepingan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kepinganList: previewKepingan }),
      });

      const zip = new JSZip();
      const template = templates[selectedTemplate];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context tidak tersedia");

      for (const kepingan of previewKepingan) {
        const qrContent = `${WEBSITE_URL}/${kepingan.uuid_random}`;
        const uuidSlice = kepingan.uuid_random.substring(0, 6).toUpperCase();
        const validationCode = kepingan.kode_validasi;

        const templateImg = new window.Image();
        templateImg.crossOrigin = "Anonymous";

        const qrImg = new window.Image();
        qrImg.src = await QRCode.toDataURL(qrContent, {
          width: template.qrSize,
          margin: 1,
        });

        await new Promise((resolve, reject) => {
          templateImg.onload = resolve;
          templateImg.onerror = reject;
          templateImg.src = template.url;
        });

        canvas.width = templateImg.width;
        canvas.height = templateImg.height;

        ctx.drawImage(templateImg, 0, 0);
        ctx.drawImage(qrImg, template.qrX, template.qrY);

        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = template.font4;
        ctx.fillText(
          template.staticText,
          template.staticTextX,
          template.staticTextY
        );

        ctx.font = template.font3;
        ctx.fillText(`${gramasiProduk}`, template.weightX, template.weightY);
        ctx.fillText(`${fineness}`, template.finenessX, template.finenessY);

        ctx.font = template.font1;
        ctx.fillText(validationCode, template.textX, template.textY);

        ctx.font = template.font2;
        ctx.fillText(uuidSlice, template.textX, template.textY + 40);

        const finalImage = canvas.toDataURL("image/png");
        const blob = await (await fetch(finalImage)).blob();
        zip.file(`qrcode_${uuidSlice}_${validationCode}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const cleanNama = namaProduk.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanGramasi = gramasiProduk.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `QR_Bullion_${cleanNama}_${cleanGramasi}.zip`;
      saveAs(zipBlob, fileName);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat gambar QR.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Buat QR Code untuk &quot;{namaProduk} - {gramasiProduk}&quot;
          </DialogTitle>
          <DialogDescription>
            {isBullionSeries
              ? "Pilih jumlah dan ukuran template untuk QR code Silver Bullion."
              : isCustomSeries
              ? "Produk ini akan menggunakan QR code generik."
              : "Masukkan jumlah QR code unik yang ingin Anda buat."}
          </DialogDescription>
        </DialogHeader>

        {previewKepingan.length > 0 ? (
          <div className="py-4 flex flex-col md:flex-row gap-6">
            {isBullionSeries && previewImage && (
              <div className="md:w-1/2">
                <p className="text-sm text-muted-foreground mb-2">
                  Contoh Pratinjau (1 dari {previewKepingan.length}):
                </p>
                <Image
                  src={previewImage}
                  alt="Pratinjau QR Code"
                  width={500} // Example: Replace with the actual width of your QR code image
                  height={500} // Example: Replace with the actual height
                  className="rounded-md border w-full h-auto" // Your styling classes still work!
                />
              </div>
            )}
            <div className={isBullionSeries ? "md:w-1/2" : "w-full"}>
              <h4 className="font-semibold mb-2">
                {previewKepingan.length} Kode Siap Dibuat
              </h4>
              <div className="max-h-64 overflow-y-auto rounded-md border p-2 text-xs font-mono">
                {previewKepingan.map((k) => (
                  <div
                    key={k.uuid_random}
                    className="grid grid-cols-2 gap-x-4 items-center py-1"
                  >
                    <span className="truncate">
                      {k.uuid_random.substring(0, 12)}...
                    </span>
                    <span className="text-right font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {k.kode_validasi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isBullionSeries ? (
          <div className="py-4 space-y-4">
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
            <div>
              <Label>Pilih Ukuran Template</Label>
              <RadioGroup
                value={selectedTemplate}
                onValueChange={(val: string) =>
                  setSelectedTemplate(val as TemplateKey)
                }
                className="mt-2 grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="small"
                    id="small"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="small"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Kecil
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="medium"
                    id="medium"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="medium"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Sedang
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="large"
                    id="large"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="large"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Besar
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ) : (
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
          </div>
        )}
        {error && (
          <p className="col-span-4 text-center text-sm text-red-500 py-2">
            {error}
          </p>
        )}

        <DialogFooter>
          {previewKepingan.length > 0 ? (
            isBullionSeries ? (
              <Button
                onClick={handleSaveAndDownloadTemplatedZip}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading
                  ? "Menyimpan & Mengunduh..."
                  : `Simpan & Download ${previewKepingan.length} QR (ZIP)`}
              </Button>
            ) : (
              <Button
                onClick={handleSaveAndDownload}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading
                  ? "Menyimpan & Mengunduh..."
                  : `Simpan & Download ${previewKepingan.length} QR Code`}
              </Button>
            )
          ) : isCustomSeries ? (
            <Button onClick={handleDownloadCustomQR} disabled={isLoading}>
              {isLoading ? "Membuat..." : "Download QR Code"}
            </Button>
          ) : (
            <Button onClick={handlePreview} disabled={isLoading}>
              {isLoading ? "Membuat Pratinjau..." : "Buat Pratinjau"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
