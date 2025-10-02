"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { Trash2, Lock, Unlock, ShieldAlert } from "lucide-react";
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

export default function KepinganPage() {
  const [data, setData] = useState<Kepingan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedKepingan, setSelectedKepingan] = useState<Kepingan | null>(
    null
  );
  const [blockReason, setBlockReason] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const kepinganData: Kepingan[] = await apiClient("/api/admin/kepingan", {
        cache: "no-store",
      });
      setData(kepinganData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(
    () =>
      data.filter(
        (k: Kepingan) =>
          k.uuid_random.toLowerCase().includes(searchTerm.toLowerCase()) ||
          k.kode_validasi.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [data, searchTerm]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredData.map((k: Kepingan) => k.id_kepingan));
    } else {
      setSelectedRows([]);
    }
  };

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
        `Anda yakin ingin menghapus ${selectedRows.length} kepingan terpilih?`
      )
    )
      return;

    const originalData = [...data];
    const idsToDelete = new Set(selectedRows);

    setData((currentData: Kepingan[]) =>
      currentData.filter((item: Kepingan) => !idsToDelete.has(item.id_kepingan))
    );
    setSelectedRows([]);

    try {
      await apiClient("/api/admin/kepingan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(idsToDelete) }),
      });
    } catch (error) {
      console.error("Error saat menghapus:", error);
      alert("Gagal menghapus kepingan. Mengembalikan data.");
      setData(originalData);
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
    if (isBlocking && !blockReason) {
      alert("Alasan pemblokiran wajib diisi.");
      return;
    }

    const originalData = [...data];

    setData((currentData: Kepingan[]) =>
      currentData.map((item: Kepingan) =>
        item.id_kepingan === selectedKepingan.id_kepingan
          ? {
              ...item,
              is_blocked: isBlocking,
              block_reason: isBlocking ? blockReason : null,
              blocked_at: isBlocking ? new Date().toISOString() : null,
            }
          : item
      )
    );
    setIsAlertOpen(false);

    const payload = {
      is_blocked: isBlocking,
      block_reason: isBlocking ? blockReason : null,
    };

    try {
      await apiClient(`/api/admin/kepingan/block/${selectedKepingan.uuid_random}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSelectedKepingan(null);
    } catch (err) {
      console.error("Error saat mengubah status blokir:", err);
      alert("Gagal mengubah status blokir. Mengembalikan data.");
      setData(originalData);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Manajemen Kepingan Produk</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Semua Kepingan</CardTitle>
          <CardDescription>
            Lacak, kelola, blokir, dan hapus setiap kepingan produk yang telah
            dibuat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      filteredData.length > 0 &&
                      selectedRows.length === filteredData.length
                    }
                    onCheckedChange={(checked: boolean) =>
                      handleSelectAll(checked)
                    }
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
              ) : (
                filteredData.map((kepingan: Kepingan) => (
                  <TableRow
                    key={kepingan.id_kepingan}
                    data-state={
                      selectedRows.includes(kepingan.id_kepingan) && "selected"
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
                          {kepingan.pemilik_user_id}
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
                ))
              )}
            </TableBody>
          </Table>
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
                ? `Anda yakin ingin membuka blokir UUID: ${selectedKepingan?.uuid_random}?`
                : `Harap berikan alasan pemblokiran untuk UUID: ${selectedKepingan?.uuid_random}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!selectedKepingan?.is_blocked && (
            <div className="grid gap-2 my-4">
              <Label htmlFor="reason">Alasan Pemblokiran</Label>
              <Input
                id="reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Contoh: Produk dilaporkan hilang"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlockToggle}>
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
