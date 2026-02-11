"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Smartphone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";

// --- Tipe Data ---
type ScanLog = {
  log_id: number;
  scan_timestamp: string;
  latitude: string;
  longitude: string;
  nama_produk: string;
  gramasi_produk: string;
  nama_user: string | null;
  uuid_random: string;
  user_agent: string | null;
};

// [TAMBAHAN] Tipe untuk Pagination Meta
type PaginationMeta = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

// --- Komponen Utama ---
export default function HistoriPage() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // [TAMBAHAN] State Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 15,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // [MODIFIKASI] Fetch Data dengan parameter page & search
  const fetchHistory = useCallback(
    async (currentPage: number, search: string) => {
      setIsLoading(true);
      const token = localStorage.getItem("admin_access_token");

      try {
        // Panggil API dengan query params
        const res = await fetch(
          `${API_URL}/api/admin/scan-history?page=${currentPage}&limit=15&search=${search}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // Cek error dengan membaca body response
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              errorData.error ||
              `Gagal mengambil data (${res.status})`,
          );
        }

        const response = await res.json();

        // Backend mengembalikan { data: [], pagination: {} }
        setLogs(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        // Tampilkan pesan error hanya jika bukan masalah teknis sementara
        if (err instanceof Error && !err.message.includes("syntax error")) {
          toast.error(err.message);
        } else {
          toast.error("Gagal memuat histori. Sedang ada perbaikan sistem.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL],
  );

  // Efek untuk memuat data saat page atau searchTerm berubah (dengan debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(page, searchTerm);
    }, 500); // Tunggu 500ms setelah mengetik

    return () => clearTimeout(timer);
  }, [page, searchTerm, fetchHistory]);

  // Reset ke halaman 1 saat user mengetik search baru
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Fungsi Helper UI
  const getScanSource = (userAgent: string | null) => {
    if (!userAgent) return { icon: <Globe className="h-4 w-4" />, text: "Web" };
    if (userAgent.includes("okhttp") || userAgent.includes("Expo"))
      return { icon: <Smartphone className="h-4 w-4" />, text: "Mobile App" };
    return { icon: <Globe className="h-4 w-4" />, text: "Web Browser" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histori Scanner</h1>
        <p className="text-muted-foreground">
          Memantau aktivitas pemindaian produk secara real-time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Pemindaian ({pagination.totalItems})</CardTitle>
          <CardDescription>Menampilkan 15 data per halaman.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Input Pencarian */}
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari User, Produk, atau UUID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu Scan</TableHead>
                  <TableHead>User (Pemindai)</TableHead>
                  <TableHead>Sumber Scan</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Lokasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : logs.length > 0 ? (
                  logs.map((log) => {
                    const source = getScanSource(log.user_agent);
                    return (
                      <TableRow key={log.log_id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(log.scan_timestamp)}
                        </TableCell>
                        <TableCell>
                          {log.nama_user ? (
                            <span className="font-medium text-blue-700">
                              {log.nama_user}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">
                              (Tamu / Belum Login)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex w-fit items-center gap-1 font-normal"
                          >
                            {source.icon} {source.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.nama_produk}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.gramasi_produk}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {/* [MODIFIKASI] Menampilkan UUID lengkap tanpa substring */}
                          {log.uuid_random || "-"}
                        </TableCell>
                        <TableCell>
                          {log.latitude && log.longitude ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Lihat Peta
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Tidak ada histori scan ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Footer Pagination */}
        <CardFooter className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Halaman {pagination.currentPage} dari {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page >= pagination.totalPages || isLoading}
            >
              Berikutnya
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
