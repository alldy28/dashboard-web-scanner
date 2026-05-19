/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  QrCode,
  Hash,
  Package,
  CheckCircle2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/api";

// Tipe data untuk dropdown produk
type Product = {
  id_produk: number;
  nama_produk: string;
  gramasi_produk: string;
  series_produk: string; // Pastikan backend mengembalikan properti ini
};

// Fungsi helper untuk mengekstrak UUID dari berbagai format QR
const extractUuid = (data: string): string | null => {
  if (!data) return null;
  const trimmedData = data.trim();
  console.log("[ExtractUUID] Raw input:", trimmedData);

  // Regex standar untuk UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // 1. Cek apakah input sudah berupa UUID mentah
  if (uuidRegex.test(trimmedData)) {
    console.log("[ExtractUUID] Input is a raw UUID:", trimmedData);
    return trimmedData;
  }

  // 2. Coba parse sebagai JSON (Format: {"uuid":"..."})
  try {
    const parsedJson = JSON.parse(trimmedData);
    console.log("[ExtractUUID] Parsed as JSON:", parsedJson);
    if (
      parsedJson &&
      typeof parsedJson.uuid === "string" &&
      uuidRegex.test(parsedJson.uuid)
    ) {
      return parsedJson.uuid;
    }
  } catch (e) {
    // Abaikan jika bukan JSON
    console.log("[ExtractUUID] Input is not valid JSON.");
  }

  // 3. Coba parse sebagai URL atau Path (Format: https://.../verif/...)
  try {
    const urlPath = trimmedData.startsWith("http")
      ? new URL(trimmedData).pathname
      : trimmedData;
    console.log("[ExtractUUID] URL path extracted:", urlPath);
    const pathParts = urlPath.split("/").filter(Boolean);

    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (uuidRegex.test(lastPart)) {
        console.log("[ExtractUUID] UUID extracted from URL path:", lastPart);
        return lastPart;
      }
    }
  } catch (e) {
    // Abaikan jika bukan URL
    console.log("[ExtractUUID] Input is not a valid URL or path.", e);
  }

  console.warn("[ExtractUUID] Failed to extract valid UUID from input.");
  return null; // Jika semua pengecekan gagal
};

export default function TambahKepinganPage() {
  const router = useRouter();

  // State untuk data form
  const [qrContent, setQrContent] = useState("");
  const [productId, setProductId] = useState("");
  const [validationCode, setValidationCode] = useState("");

  // State untuk data produk (dropdown) dan status loading
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // [BARU] State untuk Modal Sukses
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Mengambil daftar produk dari API saat komponen dimuat
  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetchingProducts(true);
      console.log("[FetchProducts] Memulai pengambilan data produk...");
      try {
        // Tambahkan ?limit=1000 untuk memastikan semua produk terambil, tidak terpotong pagination
        const response = await apiClient("/api/admin/produk?limit=1000");
        console.log("[FetchProducts] Respons API raw:", response);

        // Ekstrak data, karena respons bisa { data: [...] } atau [...]
        const productData = response.data || response;
        console.log("[FetchProducts] Data terekstrak:", productData);

        // Pastikan productData adalah array sebelum mem-filter
        if (Array.isArray(productData)) {
          // Memfilter produk agar "Silver Custom" tidak dimasukkan ke state dropdown
          const filteredProducts = productData.filter(
            (p: Product) => p.series_produk !== "Silver Custom",
          );
          console.log(
            "[FetchProducts] Data setelah difilter (Silver Custom dihilangkan):",
            filteredProducts,
          );
          setProducts(filteredProducts);
        } else {
          console.warn(
            "[FetchProducts] Format data produk tidak valid. Expected Array, got:",
            typeof productData,
            productData,
          );
          setProducts([]);
        }
      } catch (error) {
        console.error("[FetchProducts] Gagal mengambil data produk:", error);
        toast.error("Gagal memuat daftar produk untuk dropdown.");
      } finally {
        setIsFetchingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Fungsi untuk menangani submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[HandleSubmit] Form submitted.");
    console.log(
      "[HandleSubmit] Input values - QR:",
      qrContent,
      "ProductID:",
      productId,
      "ValidationCode:",
      validationCode,
    );

    if (!qrContent || !productId || !validationCode) {
      console.warn("[HandleSubmit] Validasi gagal: Ada field yang kosong.");
      toast.warning("Mohon lengkapi semua field yang tersedia.");
      return;
    }

    // Ekstrak UUID menggunakan fungsi helper
    const finalUuid = extractUuid(qrContent);
    console.log("[HandleSubmit] Final UUID hasil ekstraksi:", finalUuid);

    if (!finalUuid) {
      toast.error(
        "Format QR (UUID) tidak valid. Pastikan format berupa UUID, JSON, atau URL yang benar.",
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      uuid_random: finalUuid, // Gunakan UUID yang sudah diekstrak
      produk_id: parseInt(productId),
      kode_validasi: validationCode,
    };

    console.log("[HandleSubmit] Payload yang akan dikirim ke API:", payload);

    try {
      const response = await apiClient("/api/admin/kepingan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[HandleSubmit] Respons berhasil dari API:", response);

      // Tampilkan toast dan buka modal sukses
      toast.success("Data kepingan berhasil ditambahkan!");
      setIsSuccessModalOpen(true);

      // Reset form setelah berhasil
      setQrContent("");
      setProductId("");
      setValidationCode("");
    } catch (error) {
      console.error("[HandleSubmit] Error saat submit data kepingan:", error);
      if (error instanceof Error) {
        console.error("[HandleSubmit] Error message:", error.message);
        console.error("[HandleSubmit] Error stack:", error.stack);
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data kepingan baru.",
      );
    } finally {
      setIsSubmitting(false);
      console.log("[HandleSubmit] Proses submit selesai (finally block).");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tambah Kepingan (ID Produk)
        </h1>
        <p className="text-muted-foreground mt-2">
          Masukkan data kepingan secara manual untuk didaftarkan ke dalam
          sistem.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Form Data Kepingan</CardTitle>
            <CardDescription>
              Pastikan UUID (Isi QR) dan Kode Validasi unik dan belum pernah
              digunakan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Field: Pilih Produk */}
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center gap-2">
                <Package className="w-4 h-4" /> Pilih Produk
              </Label>
              <select
                id="product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isFetchingProducts}
                required
              >
                <option value="" disabled>
                  {isFetchingProducts
                    ? "Memuat produk..."
                    : "-- Pilih Produk --"}
                </option>
                {products.map((p) => (
                  <option key={p.id_produk} value={p.id_produk}>
                    {p.nama_produk} ({p.gramasi_produk})
                  </option>
                ))}
              </select>
            </div>

            {/* Field: Isi QR / UUID */}
            <div className="space-y-2">
              <Label htmlFor="qrContent" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" /> Isi QR (UUID / JSON / URL)
              </Label>
              <Input
                id="qrContent"
                placeholder='Contoh: {"uuid":"a1d1..."}, URL verif, atau UUID langsung'
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Sistem otomatis akan mengekstrak UUID jika formatnya berupa link
                atau JSON.
              </p>
            </div>

            {/* Field: Kode Validasi */}
            <div className="space-y-2">
              <Label
                htmlFor="validationCode"
                className="flex items-center gap-2"
              >
                <Hash className="w-4 h-4" /> Isi Kode (Kode Validasi)
              </Label>
              <Input
                id="validationCode"
                placeholder="Contoh: AB1234CD"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Masukkan kode pendek alfanumerik untuk validasi kepingan.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 bg-gray-50/50 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || isFetchingProducts}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Simpan Data
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* [BARU] Popup/Modal Sukses Tambah Data */}
      <AlertDialog
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
      >
        <AlertDialogContent className="flex flex-col items-center justify-center text-center p-8 sm:max-w-md">
          <AlertDialogHeader className="flex flex-col items-center">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-slate-900">
              Berhasil!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base text-gray-600 mt-2">
              Data kepingan produk telah berhasil ditambahkan ke dalam sistem
              dan siap diverifikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center w-full mt-6">
            <AlertDialogAction
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              Tutup & Lanjut Tambah
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
