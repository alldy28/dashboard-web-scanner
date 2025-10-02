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
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Globe, Smartphone } from "lucide-react";

// --- Tipe Data ---
type ScanLog = {
  log_id: number;
  scan_timestamp: string;
  latitude: string;
  longitude: string;
  nama_produk: string;
  gramasi_produk: string;
  nama_user: string | null; // Bisa null untuk scan dari web
  uuid_random: string;
  user_agent: string | null; // Bisa null
};

// --- Komponen Utama ---
export default function HistoriPage() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient("/api/admin/scan-history");
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          throw new Error("Format data yang diterima dari server salah.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs.filter(
        (log) =>
          (log.nama_user || "scan web")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          log.uuid_random.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [logs, searchTerm]
  );

  // Fungsi untuk membedakan sumber scan
  const getScanSource = (userAgent: string | null) => {
    if (!userAgent) return { icon: <Globe className="h-4 w-4" />, text: "Web" };
    if (userAgent.includes("okhttp"))
      return { icon: <Smartphone className="h-4 w-4" />, text: "Mobile App" };
    return { icon: <Globe className="h-4 w-4" />, text: "Web Browser" };
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Histori Scanner Pengguna</h1>
      <Card>
        <CardHeader>
          <CardTitle>Log Pemindaian</CardTitle>
          <CardDescription>
            Lacak semua aktivitas pemindaian yang dilakukan oleh pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Cari berdasarkan Nama User atau UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm mb-4"
          />
          {error && <p className="text-sm text-red-500 mb-4">Error: {error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu Scan</TableHead>
                <TableHead>User</TableHead>
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
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const source = getScanSource(log.user_agent);
                  return (
                    <TableRow key={log.log_id}>
                      <TableCell>
                        {new Date(log.scan_timestamp).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {log.nama_user || (
                          <span className="text-muted-foreground italic">
                            Scan Web (Anonim)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {source.icon} {source.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.nama_produk} ({log.gramasi_produk})
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.uuid_random}
                      </TableCell>
                      <TableCell>
                        {log.latitude && log.longitude ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Lihat di Peta
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Tidak ada data histori.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
