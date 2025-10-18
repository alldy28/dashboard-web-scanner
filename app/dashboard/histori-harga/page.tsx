"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Minus, Search, X } from "lucide-react";
import { apiClient } from "@/lib/api";

// --- Tipe Data ---
type HargaHistori = {
  id_histori: number;
  tipe_penyesuaian: "naik" | "turun" | "tetap";
  nilai_penyesuaian: string;
  nilai_pergramasi: string;
  kolom_harga: "harga_produk" | "harga_buyback";
  tanggal_update: string;
};

// --- Komponen Tabel Histori ---
const HistoriTable = ({
  data,
  isLoading,
}: {
  data: HargaHistori[];
  isLoading: boolean;
}) => {
  const formatCurrency = (value: string) => {
    if (value === null || isNaN(parseFloat(value))) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const renderAdjustmentInfo = (log: HargaHistori) => {
    const value = formatCurrency(log.nilai_penyesuaian);

    if (log.tipe_penyesuaian === "naik") {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-100 text-green-800">
            <TrendingUp className="h-4 w-4 mr-1" /> Naik
          </Badge>
          <span className="text-sm text-muted-foreground">(+{value})</span>
        </div>
      );
    }
    if (log.tipe_penyesuaian === "turun") {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive">
            <TrendingDown className="h-4 w-4 mr-1" /> Turun
          </Badge>
          <span className="text-sm text-muted-foreground">(-{value})</span>
        </div>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Minus className="h-4 w-4" /> Tetap
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal & Waktu</TableHead>
          <TableHead>Penyesuaian</TableHead>
          <TableHead className="text-right">Hasil per Gram</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center">
              Memuat data...
            </TableCell>
          </TableRow>
        ) : data.length > 0 ? (
          data.map((log) => (
            <TableRow key={log.id_histori}>
              <TableCell>
                <div className="font-medium">
                  {new Date(log.tanggal_update).toLocaleDateString("id-ID", {
                    dateStyle: "long",
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(log.tanggal_update).toLocaleTimeString("id-ID", {
                    timeStyle: "short",
                  })}
                </div>
              </TableCell>
              <TableCell>{renderAdjustmentInfo(log)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(log.nilai_pergramasi)}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center">
              Belum ada data histori.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default function HistoriHargaPage() {
  const [histori, setHistori] = useState<HargaHistori[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk filter tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let endpoint = "/api/admin/harga-histori";
      // Tambahkan parameter query jika tanggal sudah diisi
      if (startDate && endDate) {
        endpoint += `?startDate=${startDate}&endDate=${endDate}`;
      }

      const data = await apiClient(endpoint);

      if (Array.isArray(data)) {
        setHistori(data);
      } else {
        throw new Error("Format data yang diterima dari server salah.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan tidak diketahui.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]); // Hanya fetch saat komponen pertama kali dimuat

  const handleFilter = () => {
    if (startDate && !endDate) {
      alert("Harap isi Tanggal Selesai.");
      return;
    }
    if (!startDate && endDate) {
      alert("Harap isi Tanggal Mulai.");
      return;
    }
    fetchHistory();
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    // Kita perlu memanggil fetchHistory di dalam useEffect agar state yang baru sempat ter-update
  };

  // Efek untuk memuat ulang data saat filter direset
  useEffect(() => {
    if (!startDate && !endDate) {
      fetchHistory();
    }
  }, [startDate, endDate, fetchHistory]);

  const historiHargaJual = useMemo(
    () => histori.filter((log) => log.kolom_harga === "harga_produk"),
    [histori]
  );
  const historiHargaBuyback = useMemo(
    () => histori.filter((log) => log.kolom_harga === "harga_buyback"),
    [histori]
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Histori Penyesuaian Harga</h1>

      {/* PENAMBAHAN: Kartu untuk Filter Tanggal */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Riwayat</CardTitle>
          <CardDescription>
            Cari riwayat harga berdasarkan rentang tanggal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid gap-2 flex-1 w-full">
            <Label htmlFor="start-date">Tanggal Mulai</Label>
            <Input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2 flex-1 w-full">
            <Label htmlFor="end-date">Tanggal Selesai</Label>
            <Input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleFilter} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" /> Terapkan
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500 mb-4">Error: {error}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Histori Harga Jual</CardTitle>
            <CardDescription>
              Catatan perubahan untuk harga jual produk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoriTable data={historiHargaJual} isLoading={isLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histori Harga Buyback</CardTitle>
            <CardDescription>
              Catatan perubahan untuk harga beli kembali.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoriTable data={historiHargaBuyback} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
