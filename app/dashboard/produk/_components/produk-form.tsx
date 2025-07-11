"use client";

import { useState, useEffect } from "react";
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

// Definisikan tipe data untuk produk
type Product = {
  id_produk?: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  harga_produk: string;
  tahun_pembuatan: number;
  upload_gambar?: string | null;
};

// Definisikan props untuk komponen form
interface ProdukFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Product | null;
}

export function ProdukForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProdukFormProps) {
  // State untuk data form teks
  const [formData, setFormData] = useState({
    nama_produk: "",
    series_produk: "",
    gramasi_produk: "",
    harga_produk: "",
    tahun_pembuatan: new Date().getFullYear(),
  });
  // State untuk file gambar yang dipilih
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect untuk mengisi form saat mode edit
  useEffect(() => {
    if (initialData) {
      setFormData({
        nama_produk: initialData.nama_produk,
        series_produk: initialData.series_produk,
        gramasi_produk: initialData.gramasi_produk,
        harga_produk: String(initialData.harga_produk),
        tahun_pembuatan: initialData.tahun_pembuatan,
      });
    } else {
      // Reset form saat mode tambah
      setFormData({
        nama_produk: "",
        series_produk: "",
        gramasi_produk: "",
        harga_produk: "",
        tahun_pembuatan: new Date().getFullYear(),
      });
    }
    // Selalu reset file dan error saat modal dibuka/data berubah
    setSelectedFile(null);
    setError(null);
  }, [initialData, isOpen]);

  // Handler untuk perubahan input teks
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler untuk perubahan input file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handler untuk submit form
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    const data = new FormData();
    data.append("nama_produk", formData.nama_produk);
    data.append("series_produk", formData.series_produk);
    data.append("gramasi_produk", formData.gramasi_produk);
    data.append("harga_produk", formData.harga_produk);
    data.append("tahun_pembuatan", String(formData.tahun_pembuatan));

    if (selectedFile) {
      data.append("gambar", selectedFile);
    } else if (initialData?.upload_gambar) {
      data.append("upload_gambar", initialData.upload_gambar);
    }

    const apiUrl = initialData?.id_produk
      ? `http://localhost:3000/api/produk/${initialData.id_produk}`
      : "http://localhost:3000/api/produk";
    const method = initialData?.id_produk ? "PUT" : "POST";

    try {
      const response = await fetch(apiUrl, {
        method,
        body: data,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Terjadi kesalahan");
      }
      onSuccess();
      onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi detail di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>

        {/* ====================================================== */}
        {/* BAGIAN JSX YANG LENGKAP DENGAN SEMUA INPUT FIELD       */}
        {/* ====================================================== */}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nama_produk" className="text-right">
              Nama
            </Label>
            <Input
              id="nama_produk"
              name="nama_produk"
              value={formData.nama_produk}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="series_produk" className="text-right">
              Series
            </Label>
            <Input
              id="series_produk"
              name="series_produk"
              value={formData.series_produk}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gramasi_produk" className="text-right">
              Gramasi
            </Label>
            <Input
              id="gramasi_produk"
              name="gramasi_produk"
              value={formData.gramasi_produk}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="harga_produk" className="text-right">
              Harga (Rp)
            </Label>
            <Input
              id="harga_produk"
              name="harga_produk"
              type="number"
              value={formData.harga_produk}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tahun_pembuatan" className="text-right">
              Tahun
            </Label>
            <Input
              id="tahun_pembuatan"
              name="tahun_pembuatan"
              type="number"
              value={formData.tahun_pembuatan}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gambar" className="text-right">
              Gambar
            </Label>
            <Input
              id="gambar"
              name="gambar"
              type="file"
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
          {initialData?.upload_gambar && !selectedFile && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div />
              <div className="col-span-3">
                <p className="text-sm text-gray-500">Gambar saat ini:</p>
                <img
                  src={`http://113.20.31.12:3000/${initialData.upload_gambar}`}
                  alt="Gambar Produk"
                  className="h-20 w-20 object-cover mt-1 rounded-md"
                />
              </div>
            </div>
          )}
          {error && (
            <p className="col-span-4 text-center text-sm text-red-500">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
