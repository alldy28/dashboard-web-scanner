/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  PackageCheck,
  Truck,
  FileText,
  AlertCircle,
  Search, // Pastikan Search diimpor
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// --- Tipe Data ---
type ProcessingOrder = {
  order_id: number;
  total_price: string;
  status: string;
  created_at: string;
  bandar_name: string;
  notes?: string | null;
  total_items?: string | number;
};

type OrderItem = {
  order_item_id: number;
  produk_id: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  upload_gambar: string | null;
  quantity: number;
  quantity_shipped: number;
  stok_produk: number;
};

// --- Komponen Shippable Item ---
const ShippableItem = ({
  item,
  onSelectionChange,
}: {
  item: OrderItem;
  onSelectionChange: (selected: boolean, quantity: number) => void;
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const pendingQty = item.quantity - item.quantity_shipped;

  const handleQuantityChange = (val: string) => {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > pendingQty) num = pendingQty;
    setQuantity(num);
    if (isSelected) onSelectionChange(true, num);
  };

  const handleCheckedChange = (checked: boolean | "indeterminate") => {
    const newCheckedState = !!checked;
    setIsSelected(newCheckedState);
    onSelectionChange(newCheckedState, quantity);
  };

  if (pendingQty <= 0) return null;

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg mb-2 bg-gray-50/50">
      <Checkbox
        id={`item-${item.order_item_id}`}
        checked={isSelected}
        onCheckedChange={handleCheckedChange}
      />
      <div className="relative h-12 w-12 flex-shrink-0 bg-white rounded border overflow-hidden">
        <Image
          src={
            item.upload_gambar
              ? `${process.env.NEXT_PUBLIC_API_URL}/${item.upload_gambar}`
              : `https://placehold.co/64x64`
          }
          alt={item.nama_produk}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-sm">{item.nama_produk}</p>
        <p className="text-xs text-muted-foreground">
          {item.series_produk} • {item.gramasi_produk}
        </p>
        <p className="text-xs text-orange-600 font-medium">
          Pending: {pendingQty} Pcs
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Kirim:</Label>
        <Input
          type="number"
          className="w-16 h-8 text-center bg-white"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          max={pendingQty}
          min={1}
          disabled={!isSelected}
        />
      </div>
    </div>
  );
};

export default function StockConfirmationPage() {
  const [orders, setOrders] = useState<ProcessingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProcessingOrder | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // [TAMBAHAN] State untuk Search Term
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk form pengiriman
  const [itemsToShip, setItemsToShip] = useState<
    Map<number, { produk_id: number; quantity: number }>
  >(new Map());
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // 1. Fetch Orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("admin_access_token");
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil data pesanan.");

      const data: ProcessingOrder[] = await res.json();

      const activeOrders = data.filter(
        (order) =>
          order.status === "processing" ||
          order.status === "in_transit" ||
          order.status === "partially-shipped"
      );

      setOrders(activeOrders);
    } catch (error) {
      toast.error("Gagal memuat pesanan.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // [TAMBAHAN] Filtered Orders berdasarkan Search Term
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      order.order_id.toString().includes(term) || // Cari ID
      order.bandar_name.toLowerCase().includes(term) // Cari Nama Bandar
    );
  });

  // 2. Fetch Detail Order
  const handleOpenDetail = async (order: ProcessingOrder) => {
    setSelectedOrder(order);
    setIsDetailLoading(true);
    setItemsToShip(new Map());
    setProofFile(null);

    const token = localStorage.getItem("admin_access_token");
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${order.order_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil detail item.");
      const data = await res.json();
      setOrderItems(data.items);
    } catch (error) {
      toast.error("Gagal memuat item.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // 3. Logic Seleksi Item
  const handleSelectionChange = useCallback(
    (
      order_item_id: number,
      produk_id: number,
      selected: boolean,
      quantity: number
    ) => {
      setItemsToShip((prev) => {
        const newMap = new Map(prev);
        if (selected && quantity > 0) {
          newMap.set(order_item_id, { produk_id, quantity });
        } else {
          newMap.delete(order_item_id);
        }
        return newMap;
      });
    },
    []
  );

  // 4. Submit Pengiriman
  const handleSubmitShipment = async () => {
    if (!selectedOrder) return;
    if (itemsToShip.size === 0) {
      toast.error("Pilih minimal satu barang untuk dikirim.");
      return;
    }
    if (!proofFile) {
      toast.error("Wajib upload foto paket/resi.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("admin_access_token");

    const formData = new FormData();
    const payload = {
      itemsToShip: Array.from(itemsToShip.entries()).map(
        ([order_item_id, { produk_id, quantity }]) => ({
          order_item_id,
          produk_id,
          quantity,
        })
      ),
    };
    formData.append("data", JSON.stringify(payload));
    formData.append("proofImage", proofFile);

    try {
      const res = await fetch(
        `${API_URL}/api/admin/orders/${selectedOrder.order_id}/shipments`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || errData.message || "Gagal membuat pengiriman."
        );
      }

      toast.success("Paket berhasil dikonfirmasi");
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memproses.";
      toast.error(msg);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Konfirmasi Stok</h1>
        <p className="text-muted-foreground">
          Daftar pesanan yang siap dipacking dan dikirim oleh Divisi Stok.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Antrian Packing ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Pesanan dengan status Diproses atau Dalam Pengiriman (parsial).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* [TAMBAHAN] Input Pencarian */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari Order ID atau Nama Bandar..."
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Bandar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Order</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-center">Jumlah Item</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length > 0 ? (
                // [DIUBAH] Mapping menggunakan filteredOrders bukan orders
                filteredOrders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-bold">
                      #{order.order_id}
                    </TableCell>
                    <TableCell>{order.bandar_name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          order.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "partially-shipped"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {order.status === "in_transit"
                          ? "Dalam Pengiriman"
                          : order.status === "partially-shipped"
                          ? "Dikirim Sebagian"
                          : "Perlu Packing"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {order.notes ? (
                        <span className="text-xs text-muted-foreground italic truncate block">
                          {order.notes}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                        {order.total_items ?? "-"} Items
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleOpenDetail(order)}
                      >
                        <PackageCheck className="w-4 h-4 mr-2" />
                        Proses Kirim
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <PackageCheck className="h-10 w-10 mb-2 opacity-20" />
                      <p>
                        {searchTerm
                          ? "Pesanan tidak ditemukan."
                          : "Tidak ada antrian packing saat ini."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL PROSES PENGIRIMAN */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* ... (Konten Modal Sama Seperti Sebelumnya) ... */}
          <DialogHeader>
            <DialogTitle>
              Proses Pengiriman Order #{selectedOrder?.order_id}
            </DialogTitle>
            <DialogDescription>
              Pilih item yang sudah siap dikemas dan upload bukti foto paket.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder?.notes && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800 my-2">
              <strong>Catatan Bandar:</strong> {selectedOrder.notes}
            </div>
          )}

          <div className="space-y-4 py-4">
            {isDetailLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div>
                  <Label className="mb-2 block">
                    Daftar Barang (Belum Terkirim)
                  </Label>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
                    {orderItems.filter((i) => i.quantity > i.quantity_shipped)
                      .length > 0 ? (
                      orderItems
                        .filter((i) => i.quantity > i.quantity_shipped)
                        .map((item) => (
                          <ShippableItem
                            key={item.order_item_id}
                            item={item}
                            onSelectionChange={(selected, qty) =>
                              handleSelectionChange(
                                item.order_item_id,
                                item.produk_id,
                                selected,
                                qty
                              )
                            }
                          />
                        ))
                    ) : (
                      <p className="text-center py-4 text-green-600 font-medium">
                        Semua barang dalam pesanan ini sudah dikirim!
                      </p>
                    )}
                  </div>
                </div>

                {orderItems.some((i) => i.quantity > i.quantity_shipped) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="proof">Upload Foto Paket/Resi</Label>
                      <Input
                        id="proof"
                        type="file"
                        onChange={(e) =>
                          setProofFile(
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Foto paket yang sudah dipacking atau foto resi
                        pengiriman.
                      </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(null)}
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleSubmitShipment}
                        disabled={isSubmitting || itemsToShip.size === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Truck className="w-4 h-4 mr-2" />
                        )}
                        Konfirmasi & Kirim
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {!orderItems.some((i) => i.quantity > i.quantity_shipped) && (
                  <DialogFooter>
                    <Button onClick={() => setSelectedOrder(null)}>
                      Tutup
                    </Button>
                  </DialogFooter>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
