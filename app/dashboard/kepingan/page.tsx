// app/dashboard/kepingan/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Trash2 } from "lucide-react";

// PERBAIKAN: Tambahkan pemilik_user_id ke tipe data
type Kepingan = {
  id_kepingan: number;
  uuid_random: string;
  kode_validasi: string;
  tgl_produksi: string;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  pemilik_user_id: number | null; // Ditambahkan
};

export default function KepinganPage() {
  const [data, setData] = useState<Kepingan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // PENTING: Pastikan API Anda di '.../api/kepingan' sekarang mengirimkan data 'pemilik_user_id'
      const res = await fetch(
        "https://zh8r77hb-3000.asse.devtunnels.ms/api/kepingan"
      );
      if (!res.ok) throw new Error("Gagal mengambil data.");
      const kepinganData: Kepingan[] = await res.json();
      setData(kepinganData);
    } catch (err) {
      console.error("Gagal mengambil data kepingan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(
    () =>
      data.filter(
        (k) =>
          k.uuid_random.toLowerCase().includes(searchTerm.toLowerCase()) ||
          k.kode_validasi.includes(searchTerm)
      ),
    [data, searchTerm]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredData.map((k) => k.id_kepingan));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id]);
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus ${selectedRows.length} kepingan terpilih?`
      )
    )
      return;

    try {
      const token = localStorage.getItem("admin_token"); // Pastikan Anda menggunakan key token yang benar
      if (!token) {
        alert("Otorisasi gagal. Silakan login kembali.");
        return;
      }

      const response = await fetch(
        "https://zh8r77hb-3000.asse.devtunnels.ms/api/kepingan",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: selectedRows }),
        }
      );
      if (!response.ok) throw new Error("Gagal menghapus kepingan.");

      fetchData();
      setSelectedRows([]);
    } catch (error) {
      console.error("Error saat menghapus:", error);
      alert("Gagal menghapus kepingan.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">List Semua Kepingan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Data Kepingan</CardTitle>
          <CardDescription>
            Cari dan kelola semua kepingan yang telah dibuat.
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedRows.length === filteredData.length &&
                      filteredData.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {/* PERBAIKAN: Tambahkan header untuk Pemilik */}
                <TableHead>ID</TableHead>
                <TableHead>UUID</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Kode Validasi</TableHead>
                <TableHead>Pemilik (User ID)</TableHead>
                <TableHead>Tgl. Produksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Memuat data...
                  </TableCell>
                </TableRow> // colSpan disesuaikan
              ) : (
                filteredData.map((k) => (
                  <TableRow
                    key={k.id_kepingan}
                    data-state={
                      selectedRows.includes(k.id_kepingan) && "selected"
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(k.id_kepingan)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(k.id_kepingan, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell>{k.id_kepingan}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {k.uuid_random}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{k.nama_produk}</div>
                      <div className="text-sm text-muted-foreground">
                        {k.series_produk} - {k.gramasi_produk}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {k.kode_validasi}
                    </TableCell>
                    {/* PERBAIKAN: Tampilkan data pemilik_user_id */}
                    <TableCell>
                      {k.pemilik_user_id ? (
                        <span className="font-medium">{k.pemilik_user_id}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          Belum Dimiliki
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(k.tgl_produksi).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
