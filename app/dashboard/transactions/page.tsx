"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TransactionStatus from "../transactions/[id]/components/TransactionStatus";
import { Loader2, Search } from "lucide-react";
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

// Tipe data spesifik untuk setiap sumber API
type ConsumerTransaction = {
  transaction_id: number;
  customer_name: string;
  type: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
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
    | "in_transit"
    | "ready_for_pickup"
    | "completed"
    | "pre-order";
  createdAt: string;
  link: string;
};

export default function TransactionsProdukPage() {
  const [combinedTransactions, setCombinedTransactions] = useState<
    DisplayTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions`, {
          headers,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders`, {
          headers,
        }),
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTransactions = combinedTransactions.filter(
    (tx) =>
      (tx.name && tx.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.id.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Transaksi & Pesanan</CardTitle>
          <CardDescription>
            Monitor semua transaksi dari konsumen dan pesanan stok dari bandar.
          </CardDescription>
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
    </div>
  );
}
