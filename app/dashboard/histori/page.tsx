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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/scan-history-all")
      .then((res) => res.json())
      .then(setLogs)
      .catch((err) => console.error("Gagal mengambil data histori:", err))
      .finally(() => setIsLoading(false));
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
              ) : (
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
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
