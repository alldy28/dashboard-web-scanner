"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import Image from "next/image";

// Tipe data untuk banner
type Banner = {
  id: number;
  image_url: string;
  link_url: string;
};

// URL API - Ganti jika perlu
const API_URL = "http://localhost:3010/api/banners";

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk dialog tambah/edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fungsi untuk mengambil data banner
  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_access_token");
      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Gagal mengambil data banner.");
      const data = await response.json();
      setBanners(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Ambil data saat komponen dimuat
  useEffect(() => {
    fetchBanners();
  }, []);

  // Handler untuk membuka dialog tambah
  const handleAdd = () => {
    setCurrentBanner({});
    setIsDialogOpen(true);
  };

  // Handler untuk membuka dialog edit
  const handleEdit = (banner: Banner) => {
    setCurrentBanner(banner);
    setIsDialogOpen(true);
  };

  // Handler untuk menyimpan (tambah/edit)
  const handleSave = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem("admin_access_token");
    const method = currentBanner.id ? "PUT" : "POST";
    const url = currentBanner.id ? `${API_URL}/${currentBanner.id}` : API_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentBanner),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan banner.");
      }
      setIsDialogOpen(false);
      fetchBanners(); // Muat ulang data setelah berhasil
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler untuk menghapus banner
  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("admin_access_token");
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Gagal menghapus banner.");
      fetchBanners(); // Muat ulang data
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Banner</CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus banner promosi Anda.
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Banner
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center">Memuat data banner...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gambar</TableHead>
                  <TableHead>URL Link</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <Image
                        src={banner.image_url}
                        alt={`Banner ${banner.id}`}
                        width={120}
                        height={60}
                        className="rounded-md object-cover"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "https://placehold.co/120x60/eee/ccc?text=Error")
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {banner.link_url}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="mr-2"
                        onClick={() => handleEdit(banner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Apakah Anda yakin?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak dapat dibatalkan. Ini akan
                              menghapus banner secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(banner.id)}
                            >
                              Ya, Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog untuk Tambah/Edit Banner */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentBanner.id ? "Edit Banner" : "Tambah Banner Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi detail banner di bawah ini. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right">
                URL Gambar
              </Label>
              <Input
                id="image_url"
                value={currentBanner.image_url || ""}
                onChange={(e) =>
                  setCurrentBanner({
                    ...currentBanner,
                    image_url: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="https://.../gambar.jpg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link_url" className="text-right">
                URL Link
              </Label>
              <Input
                id="link_url"
                value={currentBanner.link_url || ""}
                onChange={(e) =>
                  setCurrentBanner({
                    ...currentBanner,
                    link_url: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="https://.../halaman-tujuan"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
