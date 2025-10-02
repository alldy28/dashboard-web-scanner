"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TransactionStatus from "@/app/dashboard/transactions/[id]/components/TransactionStatus";
import { Loader2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Tipe data untuk pesanan
type Order = {
  order_id: number;
  total_price: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'pre-order';
  created_at: string;
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("bandar_access_token");
    if (!token) {
      setError("Token tidak valid.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bandar/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil riwayat pesanan.");
      }
      const data: Order[] = await res.json();
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (value: string) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value));

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Riwayat Order ke Pusat</CardTitle>
              <CardDescription className="mt-2">
                Berikut adalah daftar pesanan stok yang telah Anda buat.
              </CardDescription>
            </div>
            {/* PERBAIKAN: Link disesuaikan dengan struktur baru Anda */}
            <Button asChild>
              <Link href="/bandar-dashboard/orders/orderproduk">
                <PlusCircle className="mr-2 h-4 w-4" />
                Order Produk
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pesanan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-medium">#{order.order_id}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell>
                        <TransactionStatus status={order.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(order.total_price)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/bandar-dashboard/orders/${order.order_id}`}>Lihat Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Anda belum pernah membuat pesanan.</TableCell>
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

