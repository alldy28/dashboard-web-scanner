"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// [TAMBAHAN] Import komponen Dialog untuk Edit
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// [TAMBAHAN] Import icon Edit dan Loader2
import {
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner"; // Asumsi Anda menggunakan sonner untuk notifikasi

type Kepingan = {
  id_kepingan: number;
  uuid_random: string;
  kode_validasi: string;
  tgl_produksi: string;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  pemilik_user_id: number | null;
  is_blocked: boolean;
  block_reason: string | null;
  blocked_at: string | null;
};

type PaginationMeta = {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ROWS_PER_PAGE = 20;

export default function KepinganPage() {
  const [data, setData] = useState<Kepingan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // State untuk Blokir
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedKepingan, setSelectedKepingan] = useState<Kepingan | null>(
    null,
  );
  const [blockReason, setBlockReason] = useState("");

  // [TAMBAHAN] State untuk Edit Kode Validasi
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingKepingan, setEditingKepingan] = useState<Kepingan | null>(null);
  const [newKodeValidasi, setNewKodeValidasi] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    currentPage: 1,
    limit: ROWS_PER_PAGE,
    totalItems: 0,
    totalPages: 1,
  });

  const fetchData = useCallback(
    async (page: number, limit: number, search: string = "") => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `/api/admin/kepingan?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search,
        )}`;

        const response: { kepinganList: Kepingan[] } & PaginationMeta =
          await apiClient(url, {
            cache: "no-store",
          });

        setData(response.kepinganList || []);
        setPaginationMeta({
          currentPage: response.currentPage,
          limit: response.limit,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data.");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [setData, setPaginationMeta, setIsLoading, setError],
  );

  useEffect(() => {
    fetchData(1, ROWS_PER_PAGE, "");
  }, [fetchData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData(1, ROWS_PER_PAGE, searchTerm);
      setSelectedRows([]);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchData]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= paginationMeta.totalPages) {
      fetchData(page, ROWS_PER_PAGE, searchTerm);
      setSelectedRows([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => {
        const newSelected = new Set(prev);
        data.forEach((k) => newSelected.add(k.id_kepingan));
        return Array.from(newSelected);
      });
    } else {
      setSelectedRows((prev) =>
        prev.filter((id) => !data.map((k) => k.id_kepingan).includes(id)),
      );
    }
  };

  const isAllRowsSelectedOnPage =
    data.length > 0 && data.every((k) => selectedRows.includes(k.id_kepingan));

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev: number[]) => [...prev, id]);
    } else {
      setSelectedRows((prev: number[]) =>
        prev.filter((rowId: number) => rowId !== id),
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (
      !window.confirm(
        `Anda yakin ingin menghapus ${selectedRows.length} kepingan terpilih? Aksi ini tidak dapat dibatalkan.`,
      )
    )
      return;

    const idsToDelete = Array.from(selectedRows);
    setSelectedRows([]);

    try {
      await apiClient("/api/admin/kepingan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      alert(`${idsToDelete.length} kepingan berhasil dihapus.`);
      fetchData(paginationMeta.currentPage, ROWS_PER_PAGE, searchTerm);
    } catch (error) {
      console.error("Error saat menghapus:", error);
      alert("Gagal menghapus kepingan.");
      fetchData(paginationMeta.currentPage, ROWS_PER_PAGE, searchTerm);
    }
  };

  // --- Logic Blokir ---
  const openBlockDialog = (kepingan: Kepingan) => {
    setSelectedKepingan(kepingan);
    setBlockReason(kepingan.block_reason || "");
    setIsAlertOpen(true);
  };

  const handleBlockToggle = async () => {
    if (!selectedKepingan) return;

    const isBlocking = !selectedKepingan.is_blocked;
    if (isBlocking && !blockReason.trim()) {
      alert("Alasan pemblokiran wajib diisi.");
      return;
    }

    const payload = {
      is_blocked: isBlocking,
      block_reason: isBlocking ? blockReason.trim() : null,
    };

    try {
      await apiClient(
        `/api/admin/kepingan/block/${selectedKepingan.uuid_random}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      fetchData(paginationMeta.currentPage, ROWS_PER_PAGE, searchTerm);
      setSelectedKepingan(null);
      setBlockReason("");
      setIsAlertOpen(false);
    } catch (err) {
      console.error("Error saat mengubah status blokir:", err);
      alert("Gagal mengubah status blokir.");
    }
  };

  // --- [TAMBAHAN] Logic Edit Kode Validasi ---
  const handleEditClick = (kepingan: Kepingan) => {
    setEditingKepingan(kepingan);
    setNewKodeValidasi(kepingan.kode_validasi);
    setIsEditOpen(true);
  };

  const handleSaveKodeValidasi = async () => {
    if (!editingKepingan) return;
    if (!newKodeValidasi.trim()) {
      toast.error("Kode validasi tidak boleh kosong.");
      return;
    }
    if (newKodeValidasi.length !== 6) {
      // Asumsi kode validasi 6 digit
      toast.error("Kode validasi harus 6 karakter.");
      return;
    }

    setIsSaving(true);
    try {
      // Panggil API Backend
      // Pastikan Anda membuat endpoint ini di backend: PUT /api/admin/kepingan/:uuid/update-code
      await apiClient(
        `/api/admin/kepingan/${editingKepingan.uuid_random}/update-code`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kode_validasi: newKodeValidasi }),
        },
      );

      toast.success("Kode validasi berhasil diperbarui.");

      // Update data di tabel lokal
      setData((prev) =>
        prev.map((item) =>
          item.id_kepingan === editingKepingan.id_kepingan
            ? { ...item, kode_validasi: newKodeValidasi }
            : item,
        ),
      );

      setIsEditOpen(false);
      setEditingKepingan(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengupdate kode validasi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manajemen Kepingan Produk</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Semua Kepingan</CardTitle>
          <CardDescription>
            Lacak, kelola, blokir, dan hapus setiap kepingan produk. (20
            data/halaman)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <Input
              placeholder="Cari UUID atau Kode Validasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            {selectedRows.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedRows.length}
                )
              </Button>
            )}
          </div>

          {error && <p className="text-sm text-red-500 mb-4">Error: {error}</p>}

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllRowsSelectedOnPage}
                      onCheckedChange={(checked: boolean) =>
                        handleSelectAll(checked)
                      }
                      aria-label="Pilih semua baris di halaman ini"
                    />
                  </TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Kode Validasi</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Blokir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Memuat data kepingan...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {searchTerm
                        ? `Tidak ditemukan kepingan untuk "${searchTerm}".`
                        : "Tidak ada kepingan produk yang tersedia."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((kepingan: Kepingan) => (
                    <TableRow
                      key={kepingan.id_kepingan}
                      data-state={
                        selectedRows.includes(kepingan.id_kepingan) &&
                        "selected"
                      }
                      className={
                        kepingan.is_blocked
                          ? "bg-red-50/50 hover:bg-red-100/50"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(kepingan.id_kepingan)}
                          onCheckedChange={(checked: boolean) =>
                            handleSelectRow(kepingan.id_kepingan, checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {kepingan.nama_produk}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {kepingan.gramasi_produk}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {kepingan.uuid_random}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold">
                        {kepingan.kode_validasi}
                      </TableCell>
                      <TableCell>
                        {kepingan.pemilik_user_id ? (
                          <span className="font-medium">
                            ID: {kepingan.pemilik_user_id}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Belum Dimiliki
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kepingan.is_blocked ? (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                            title={kepingan.block_reason || "Diblokir"}
                          >
                            <ShieldAlert className="h-4 w-4" /> Diblokir
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Aktif</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(kepingan.blocked_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* [TAMBAHAN] Tombol Edit */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(kepingan)}
                            title="Edit Kode Validasi"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBlockDialog(kepingan)}
                            className={
                              kepingan.is_blocked
                                ? "text-green-600 border-green-200 hover:bg-green-50"
                                : "text-red-600 border-red-200 hover:bg-red-50"
                            }
                          >
                            {kepingan.is_blocked ? (
                              <>
                                <Unlock className="h-4 w-4 mr-1" /> Buka
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 mr-1" /> Blokir
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Kontrol Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Menampilkan {data.length} dari **{paginationMeta.totalItems}**
              total kepingan.
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(paginationMeta.currentPage - 1)}
                disabled={paginationMeta.currentPage <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-sm font-medium">
                Halaman **{paginationMeta.currentPage}** dari **
                {paginationMeta.totalPages}**
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(paginationMeta.currentPage + 1)}
                disabled={
                  paginationMeta.currentPage >= paginationMeta.totalPages ||
                  isLoading
                }
              >
                Berikutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* [TAMBAHAN] Modal Edit Kode Validasi */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kode Validasi</DialogTitle>
            <DialogDescription>
              Ubah kode validasi untuk kepingan dengan UUID: <br />
              <span className="font-mono font-bold text-xs">
                {editingKepingan?.uuid_random}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="kode">Kode Validasi Baru</Label>
            <Input
              id="kode"
              value={newKodeValidasi}
              onChange={(e) => setNewKodeValidasi(e.target.value)}
              placeholder="Masukkan 6 digit kode baru"
              className="mt-2 text-center text-lg font-mono tracking-widest"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveKodeValidasi} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Blokir (Yang Lama) */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {`Konfirmasi ${
                selectedKepingan?.is_blocked ? "Buka Blokir" : "Blokir"
              } Kepingan`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedKepingan?.is_blocked
                ? `Anda yakin ingin membuka blokir UUID: ${selectedKepingan?.uuid_random}? Produk akan kembali **Aktif**.`
                : `Harap berikan alasan pemblokiran untuk UUID: ${selectedKepingan?.uuid_random}. Produk akan menjadi **Tidak Dapat Divalidasi**.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!selectedKepingan?.is_blocked && (
            <div className="grid gap-2 my-4">
              <Label htmlFor="reason">Alasan Pemblokiran</Label>
              <Input
                id="reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Contoh: Produk dilaporkan hilang atau palsu"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockToggle}
              disabled={!selectedKepingan?.is_blocked && !blockReason.trim()}
            >
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
