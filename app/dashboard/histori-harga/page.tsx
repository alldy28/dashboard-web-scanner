"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// --- Tipe Data ---
type HargaHistori = {
  id_histori: number;
  tipe_penyesuaian: "naik" | "turun" | "tetap";
  nilai_penyesuaian: string;
  nilai_pergramasi: string;
  kolom_harga: "harga_produk" | "harga_buyback";
  tanggal_update: string;
};

// --- API Config ---
const API_BASE_URL = "https://zh8r77hb-3000.asse.devtunnels.ms"; // Ganti dengan URL API Anda

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

  // PERBAIKAN: Komponen ini sekarang merender tipe dan nilai penyesuaian
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
    // Untuk tipe 'tetap', kita tidak menampilkan nilai penyesuaian
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

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          throw new Error("Sesi admin tidak valid. Silakan login kembali.");
        }

        const res = await fetch(`${API_BASE_URL}/api/harga-histori`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal mengambil data histori.");
        }

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
    };

    fetchHistory();
  }, []);

  // Memisahkan data histori menjadi dua
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
      {error && <p className="text-sm text-red-500 mb-4">Error: {error}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tabel Harga Jual */}
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

        {/* Tabel Harga Buyback */}
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
