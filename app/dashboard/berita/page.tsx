"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, Link } from "lucide-react";
import { apiClient } from "@/lib/api"; // PERBAIKAN: Impor apiClient

// --- Tipe Data ---
type Berita = {
  id_berita: number;
  judul: string;
  konten: string;
  gambar_thumbnail: string | null;
  created_at: string;
  link_url: string | null;
};

// --- API Config ---
const API_BASE_URL = "https://apiv2.silverium.id"; // Ganti dengan URL API Anda

// --- Komponen Form Berita ---
function BeritaForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Berita | null;
}) {
  const [judul, setJudul] = useState("");
  const [konten, setKonten] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul);
      setKonten(initialData.konten);
      setLinkUrl(initialData.link_url || "");
    } else {
      setJudul("");
      setKonten("");
      setLinkUrl("");
    }
    setSelectedFile(null);
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("judul", judul);
    formData.append("konten", konten);
    formData.append("link_url", linkUrl);
    if (selectedFile) {
      formData.append("gambar", selectedFile);
    }

    const endpoint = initialData
      ? `/api/admin/berita/${initialData.id_berita}`
      : `/api/admin/berita`;
    const method = initialData ? "PUT" : "POST";

    try {
      // PERBAIKAN: Menggunakan apiClient
      await apiClient(endpoint, {
        method,
        body: formData,
        // Tidak perlu header 'Content-Type' untuk FormData
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Berita" : "Tambah Berita Baru"}
          </DialogTitle>
          <DialogDescription>Isi detail berita di bawah ini.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="grid gap-2">
            <Label htmlFor="judul">Judul</Label>
            <Input
              id="judul"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="konten">Konten</Label>
            <Textarea
              id="konten"
              value={konten}
              onChange={(e) => setKonten(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link_url">Link URL (Opsional)</Label>
            <Input
              id="link_url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://contoh.com/berita-lengkap"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gambar">Gambar Thumbnail</Label>
            <Input
              id="gambar"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
          {initialData?.gambar_thumbnail && !selectedFile && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Gambar saat ini:</p>
              <Image
                src={`${API_BASE_URL}/${initialData.gambar_thumbnail}`}
                alt={initialData.judul}
                width={100}
                height={100}
                className="rounded-md object-cover"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
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

// --- Komponen Utama Halaman ---
export default function BeritaPage() {
  const [berita, setBerita] = useState<Berita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBerita, setSelectedBerita] = useState<Berita | null>(null);

  const fetchBerita = useCallback(async () => {
    setIsLoading(true);
    try {
      // PERBAIKAN: Menggunakan apiClient (meskipun endpoint ini publik, untuk konsistensi)
      const data: Berita[] = await apiClient("/api/admin/berita");
      setBerita(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBerita();
  }, [fetchBerita]);

  const handleAddNew = () => {
    setSelectedBerita(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Berita) => {
    setSelectedBerita(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus berita ini?"))
      return;

    try {
      // PERBAIKAN: Menggunakan apiClient untuk menghapus
      await apiClient(`/api/admin/berita/${id}`, {
        method: "DELETE",
      });

      fetchBerita(); // Refresh data
    } catch (error) {
      console.error("Error saat menghapus:", error);
      alert("Gagal menghapus berita.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Manajemen Berita</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Berita
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Artikel & Berita</CardTitle>
          <CardDescription>
            Kelola semua artikel yang akan ditampilkan di aplikasi mobile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-500 mb-4">Error: {error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Gambar</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : berita.length > 0 ? (
                berita.map((item) => (
                  <TableRow key={item.id_berita}>
                    <TableCell>
                      <Image
                        src={
                          item.gambar_thumbnail
                            ? `${API_BASE_URL}/${item.gambar_thumbnail}`
                            : "https://placehold.co/100x100/e2e8f0/e2e8f0?text=."
                        }
                        alt={item.judul}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.judul}</TableCell>
                    <TableCell>
                      {item.link_url ? (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <Link className="mr-2 h-4 w-4" />
                          Buka Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(item.id_berita)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Belum ada berita.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BeritaForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchBerita}
        initialData={selectedBerita}
      />
    </div>
  );
}
