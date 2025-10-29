"use client";

import React, { useState, useEffect, useCallback } from "react"; // ✅ useMemo dihapus jika tidak ada definisi useMemo yang tidak digunakan
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
}
 from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Trash2, Lock, Unlock, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/api";

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
}

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
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedKepingan, setSelectedKepingan] = useState<Kepingan | null>(null);
  const [blockReason, setBlockReason] = useState("");
  
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    currentPage: 1,
    limit: ROWS_PER_PAGE,
    totalItems: 0,
    totalPages: 1,
  });

  const fetchData = useCallback(async (page: number, limit: number, search: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
        const url = `/api/admin/kepingan?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
        
        const response: { kepinganList: Kepingan[] } & PaginationMeta = await apiClient(url, {
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
  }, [setData, setPaginationMeta, setIsLoading, setError]); // ✅ Tambahkan semua setter state sebagai dependency.

  // 1. useEffect untuk memuat data pertama kali (initial load)
  useEffect(() => {
    // Kita hanya perlu memanggilnya sekali saat mount. searchTerm akan ditangani oleh useEffect lain.
    fetchData(1, ROWS_PER_PAGE, ""); 
  }, [fetchData]); // ✅ Dependensi yang benar

  // 2. useEffect untuk memuat data saat pencarian (searchTerm) berubah
  useEffect(() => {
    // Selalu kembali ke halaman 1 saat search
    const handler = setTimeout(() => {
        fetchData(1, ROWS_PER_PAGE, searchTerm);
        setSelectedRows([]);
    }, 300); // Debounce 300ms untuk performa pencarian
    
    return () => {
        clearTimeout(handler);
    }
    
  }, [searchTerm, fetchData]); // ✅ Dependensi yang benar

  // Fungsi untuk mengubah halaman (memuat data baru dari server)
  const goToPage = (page: number) => {
    if (page >= 1 && page <= paginationMeta.totalPages) {
        fetchData(page, ROWS_PER_PAGE, searchTerm);
        setSelectedRows([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => {
          const newSelected = new Set(prev);
          data.forEach(k => newSelected.add(k.id_kepingan));
          return Array.from(newSelected);
      });
    } else {
      setSelectedRows((prev) => 
        prev.filter((id) => !data.map((k) => k.id_kepingan).includes(id))
      );
    }
  };
    
  const isAllRowsSelectedOnPage =
    data.length > 0 &&
    data.every((k) => selectedRows.includes(k.id_kepingan));

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev: number[]) => [...prev, id]);
    } else {
      setSelectedRows((prev: number[]) =>
        prev.filter((rowId: number) => rowId !== id)
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (
      !window.confirm(
        `Anda yakin ingin menghapus ${selectedRows.length} kepingan terpilih? Aksi ini tidak dapat dibatalkan.`
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
      await apiClient(`/api/admin/kepingan/block/${selectedKepingan.uuid_random}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      fetchData(paginationMeta.currentPage, ROWS_PER_PAGE, searchTerm);
      setSelectedKepingan(null);
      setBlockReason("");
      setIsAlertOpen(false);

    } catch (err) {
      console.error("Error saat mengubah status blokir:", err);
      alert("Gagal mengubah status blokir.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manajemen Kepingan Produk</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Semua Kepingan</CardTitle>
          <CardDescription>
            Lacak, kelola, blokir, dan hapus setiap kepingan produk. (20 data/halaman)
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
                <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedRows.length})
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
                      onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
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
                      {searchTerm ? `Tidak ditemukan kepingan untuk "${searchTerm}".` : "Tidak ada kepingan produk yang tersedia."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((kepingan: Kepingan) => (
                    <TableRow
                      key={kepingan.id_kepingan}
                      data-state={
                        selectedRows.includes(kepingan.id_kepingan) && "selected"
                      }
                      className={kepingan.is_blocked ? "bg-red-50/50 hover:bg-red-100/50" : ""}
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
                        <div className="font-medium">{kepingan.nama_produk}</div>
                        <div className="text-sm text-muted-foreground">
                          {kepingan.gramasi_produk}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {kepingan.uuid_random}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBlockDialog(kepingan)}
                        >
                          {kepingan.is_blocked ? (
                            <Unlock className="h-4 w-4 mr-2" />
                          ) : (
                            <Lock className="h-4 w-4 mr-2" />
                          )}
                          {kepingan.is_blocked ? "Buka Blokir" : "Blokir"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )
                )
              }
              </TableBody>
            </Table>
          </div>
          
          {/* Kontrol Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Menampilkan {data.length} dari **{paginationMeta.totalItems}** total kepingan.
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
                Halaman **{paginationMeta.currentPage}** dari **{paginationMeta.totalPages}**
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(paginationMeta.currentPage + 1)}
                disabled={paginationMeta.currentPage >= paginationMeta.totalPages || isLoading}
              >
                Berikutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          
        </CardContent>
      </Card>

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