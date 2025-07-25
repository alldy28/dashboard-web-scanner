"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
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

type ScanLog = {
  log_id: number;
  scan_timestamp: string;
  latitude: string;
  longitude: string;
  nama_produk: string;
  gramasi_produk: string;
  nama_user: string;
  uuid_random: string;
};

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
        // Ambil token dari localStorage
        const token = localStorage.getItem("admin_token");
        if (!token) {
          throw new Error("Sesi admin tidak valid. Silakan login kembali.");
        }

        // Lakukan fetch dengan menyertakan token di header
        const res = await fetch("https://zh8r77hb-3000.asse.devtunnels.ms/api/scan-history-all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal mengambil data histori.");
        }

        // Pastikan data yang diterima adalah array
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          throw new Error("Format data yang diterima dari server salah.");
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Terjadi kesalahan tidak diketahui.");
        }
        console.error("Gagal mengambil data histori:", err);
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
          log.nama_user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.uuid_random.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [logs, searchTerm]
  );

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
                <TableHead>ID Log</TableHead>
                <TableHead>Waktu Scan</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Lokasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>{log.log_id}</TableCell>
                    <TableCell>
                      {new Date(log.scan_timestamp).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{log.nama_user}</TableCell>
                    <TableCell>
                      {log.nama_produk} ({log.gramasi_produk})
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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
