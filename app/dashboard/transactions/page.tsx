"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TransactionStatus from "../transactions/[id]/components/TransactionStatus";
import { Loader2, Search, PackageOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";

// Tipe data spesifik untuk setiap sumber API
type ConsumerTransaction = {
  transaction_id: number;
  customer_name: string;
  type: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "in_transit"
    | "ready_for_pickup"
    | "completed"
    | "pre-order";
  created_at: string;
};

type BandarOrder = {
  order_id: number;
  bandar_name: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "in_transit"
    | "completed"
    | "pre-order";
  created_at: string;
};

// Tipe data gabungan untuk menampilkan semua jenis transaksi
type DisplayTransaction = {
  id: string;
  source: "Konsumen" | "Bandar";
  name: string;
  type: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "in_transit"
    | "ready_for_pickup"
    | "completed"
    | "pre-order";
  createdAt: string;
  link: string;
};

// [DIUBAH] Tipe data untuk item pending yang sudah digabungkan (aggregated)
type AggregatedPendingItem = {
  produk_id: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  upload_gambar: string | null;
  total_pending_qty: number; // Total qty dari SEMUA pesanan
};

// Interface untuk item detail pesanan
interface DetailItem {
  produk_id: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  upload_gambar: string | null;
  quantity: number;
  quantity_shipped: number;
}

export default function TransactionsProdukPage() {
  const [combinedTransactions, setCombinedTransactions] = useState<
    DisplayTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk Modal Pendingan
  const [pendingItems, setPendingItems] = useState<AggregatedPendingItem[]>([]);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isPendingLoading, setIsPendingLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      setError("Token tidak valid. Silakan login kembali.");
      setIsLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [consumerRes, bandarRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/transactions`, { headers }),
        fetch(`${API_URL}/api/admin/orders`, { headers }),
      ]);

      if (!consumerRes.ok || !bandarRes.ok) {
        throw new Error("Gagal mengambil data transaksi atau pesanan.");
      }

      const consumerTransactions: ConsumerTransaction[] =
        await consumerRes.json();
      const bandarOrders: BandarOrder[] = await bandarRes.json();

      const formattedConsumerTx: DisplayTransaction[] =
        consumerTransactions.map((tx) => ({
          id: tx.transaction_id.toString(),
          source: "Konsumen",
          name: tx.customer_name,
          type: tx.type.replace(/_/g, " "),
          status: tx.status,
          createdAt: tx.created_at,
          link: `/dashboard/transactions/${tx.transaction_id}`,
        }));

      const formattedBandarOrders: DisplayTransaction[] = bandarOrders.map(
        (order) => ({
          id: order.order_id.toString(),
          source: "Bandar",
          name: order.bandar_name,
          type: "Pesanan Stok",
          status: order.status,
          createdAt: order.created_at,
          link: `/dashboard/orders/${order.order_id}`,
        })
      );

      const allTransactions = [
        ...formattedConsumerTx,
        ...formattedBandarOrders,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setCombinedTransactions(allTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // [DIUBAH] Fungsi untuk mengambil dan MENGGABUNGKAN (Aggregate) item pending
  const fetchAllPendingItems = async () => {
    setIsPendingLoading(true);
    const token = localStorage.getItem("admin_access_token");

    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal mengambil data pendingan.");

      const orders: BandarOrder[] = await res.json();

      // Filter order yang statusnya masih aktif
      const activeOrders = orders.filter(
        (o) =>
          o.status === "approved" ||
          o.status === "processing" ||
          o.status === "in_transit"
      );

      // Gunakan Map untuk menggabungkan item berdasarkan produk_id
      const aggregatedMap = new Map<number, AggregatedPendingItem>();

      await Promise.all(
        activeOrders.map(async (order) => {
          const detailRes = await fetch(
            `${API_URL}/api/admin/orders/${order.order_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            detailData.items.forEach((item: DetailItem) => {
              const pendingQty = item.quantity - item.quantity_shipped;

              if (pendingQty > 0) {
                // Cek apakah produk sudah ada di Map
                const existingItem = aggregatedMap.get(item.produk_id);

                if (existingItem) {
                  // Jika sudah ada, tambahkan jumlahnya
                  existingItem.total_pending_qty += pendingQty;
                } else {
                  // Jika belum ada, buat entry baru
                  aggregatedMap.set(item.produk_id, {
                    produk_id: item.produk_id,
                    nama_produk: item.nama_produk,
                    series_produk: item.series_produk,
                    gramasi_produk: item.gramasi_produk,
                    upload_gambar: item.upload_gambar,
                    total_pending_qty: pendingQty,
                  });
                }
              }
            });
          }
        })
      );

      // Ubah Map kembali menjadi Array untuk ditampilkan
      const sortedItems = Array.from(aggregatedMap.values()).sort((a, b) =>
        a.nama_produk.localeCompare(b.nama_produk)
      );

      setPendingItems(sortedItems);
      setIsPendingModalOpen(true);
    } catch (err) {
      console.error("Gagal mengambil item pending:", err);
    } finally {
      setIsPendingLoading(false);
    }
  };

  const filteredTransactions = combinedTransactions.filter(
    (tx) =>
      (tx.name && tx.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.id.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Transaksi
          </h1>
          <p className="text-muted-foreground">
            Monitor semua transaksi dari konsumen dan pesanan stok dari bandar.
          </p>
        </div>

        <Card
          className="w-full md:w-auto min-w-[200px] cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={fetchAllPendingItems}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            {isPendingLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Pendingan
                </p>
                <div className="flex items-center gap-2">
                  <PackageOpen className="h-5 w-5 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-600">
                    Cek Detail
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>Semua riwayat pesanan masuk.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari berdasarkan ID atau Nama..."
              className="w-full rounded-lg bg-background pl-8 md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-4">Error: {error}</p>}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <TableRow key={`${tx.source}-${tx.id}`}>
                      <TableCell className="font-medium">#{tx.id}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            tx.source === "Bandar"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {tx.source}
                        </span>
                      </TableCell>
                      <TableCell>{tx.name}</TableCell>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell>
                        <TransactionStatus status={tx.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={tx.link}>Lihat Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPendingModalOpen} onOpenChange={setIsPendingModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Rekapitulasi Barang Pending</DialogTitle>
            <DialogDescription>
              Total keseluruhan item yang perlu disiapkan dari semua pesanan
              aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto pr-2">
            {pendingItems.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-amber-800 font-medium text-center">
                  Total{" "}
                  {pendingItems.reduce(
                    (sum, item) => sum + item.total_pending_qty,
                    0
                  )}{" "}
                  Pcs Barang Harus Dikirim
                </div>

                {pendingItems.map((item) => (
                  <div
                    key={item.produk_id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={
                          item.upload_gambar
                            ? `${API_URL}/${item.upload_gambar}`
                            : `https://placehold.co/64x64`
                        }
                        alt={item.nama_produk}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-base">
                        {item.nama_produk}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.series_produk} - {item.gramasi_produk}
                      </p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <span className="block text-2xl font-bold text-red-600">
                        {item.total_pending_qty}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        Pcs Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <PackageOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Semua pesanan sudah terpenuhi.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
