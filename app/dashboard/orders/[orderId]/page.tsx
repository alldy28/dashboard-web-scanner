"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, FileText, Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Tipe Data Diperbarui
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
type ShipmentItem = {
  nama_produk: string;
  quantity: number;
  series_produk: string; // <-- Ditambahkan
  gramasi_produk: string;
};
type Shipment = {
  shipment_id: number;
  status: string;
  created_at: string;
  admin_proof_url: string | null;
  items: ShipmentItem[];
};
type OrderDetails = {
  order: {
    order_id: number;
    bandar_name: string;
    total_price: string;
    status: string;
    created_at: string;
    payment_proof_url: string | null;
  };
  items: OrderItem[];
  shipments: Shipment[];
};

// Komponen untuk item yang bisa dipilih
const ShippableItem = ({ item, onSelectionChange }: { item: OrderItem, onSelectionChange: (selected: boolean, quantity: number) => void }) => {
    const [isSelected, setIsSelected] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const pendingQty = item.quantity - item.quantity_shipped;

    const handleQuantityChange = (val: string) => {
        let num = parseInt(val, 10);
        if (isNaN(num) || num < 1) num = 1;
        if (num > pendingQty) num = pendingQty;
        setQuantity(num);
        if (isSelected) {
            onSelectionChange(true, num);
        }
    };

    const handleCheckedChange = (checked: boolean | "indeterminate") => {
        const newCheckedState = !!checked;
        setIsSelected(newCheckedState);
        onSelectionChange(newCheckedState, quantity);
    };

    if (pendingQty <= 0) return null;

    return (
        <div className="flex items-center gap-4 p-2 border-b last:border-b-0">
            <Checkbox id={`item-${item.order_item_id}`} checked={isSelected} onCheckedChange={handleCheckedChange} />
            <div className="relative h-10 w-10 flex-shrink-0">
                 <Image src={item.upload_gambar ? `${process.env.NEXT_PUBLIC_API_URL}/${item.upload_gambar}` : `https://placehold.co/64x64`} alt={item.nama_produk} fill className="rounded-md object-cover" />
            </div>
            <div className="flex-grow">
                <p className="font-medium text-sm leading-tight">{item.nama_produk}</p>
                <p className="text-xs text-muted-foreground">{item.series_produk} | Pending: {pendingQty} | Stok: {item.stok_produk}</p>
            </div>
            <Input 
                type="number"
                className="w-20 h-8 text-center"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                max={pendingQty}
                min={1}
                disabled={!isSelected}
            />
        </div>
    );
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [itemsToShip, setItemsToShip] = useState<Map<number, { produk_id: number; quantity: number }>>(new Map());
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    const token = localStorage.getItem("admin_access_token");
    try {
        const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(!res.ok) throw new Error("Gagal memuat detail pesanan");
        const data = await res.json();
        setOrderDetails(data);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
        setIsLoading(false);
    }
  }, [orderId, API_URL]);
  
  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  const handleSelectionChange = useCallback((order_item_id: number, produk_id: number, selected: boolean, quantity: number) => {
      setItemsToShip(prev => {
          const newMap = new Map(prev);
          if (selected && quantity > 0) { newMap.set(order_item_id, { produk_id, quantity }); } 
          else { newMap.delete(order_item_id); }
          return newMap;
      });
  }, []);
  
  const handleCreateShipment = async () => {
    if (itemsToShip.size === 0) { toast.error("Pilih setidaknya satu item untuk dikirim."); return; }
    if (!proofFile) { toast.error("Bukti foto paket wajib diunggah."); return; }
    setIsSubmitting(true);
    const token = localStorage.getItem("admin_access_token");
    
    const formData = new FormData();
    const payload = {
        itemsToShip: Array.from(itemsToShip.entries()).map(([order_item_id, { produk_id, quantity }]) => ({ order_item_id, produk_id, quantity })),
    };
    formData.append('data', JSON.stringify(payload));
    formData.append('proofImage', proofFile);

    try {
        const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/shipments`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || "Gagal membuat pengiriman."); }
        const result = await res.json();
        toast.success(`Pengiriman #${result.shipmentId} berhasil dibuat.`);
        fetchOrderDetails();
        setItemsToShip(new Map());
        setProofFile(null);
    } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handlePrintLabel = async (shipmentId: number) => {
    const token = localStorage.getItem("admin_access_token");
    try {
      const res = await fetch(`${API_URL}/api/admin/shipments/${shipmentId}/label`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal membuat label.");
      const blob = await res.blob();
      const fileURL = window.URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const totalPendingItems = useMemo(() => {
    if (!orderDetails) return 0;
    return orderDetails.items.reduce((sum, item) => sum + (item.quantity - item.quantity_shipped), 0);
  }, [orderDetails]);

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!orderDetails) return <p className="p-6">Detail pesanan tidak ditemukan.</p>;
  
  const { order, items, shipments } = orderDetails;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <Button asChild variant="outline" size="icon" className="mb-2"><Link href="/dashboard/transactionsproduk"><ArrowLeft className="h-4 w-4"/></Link></Button>
            <h1 className="text-xl md:text-2xl font-bold">Detail Pesanan Bandar #{order.order_id}</h1>
            <p className="text-muted-foreground">Oleh: {order.bandar_name}</p>
        </div>
        <Card className="p-3 text-center flex-shrink-0">
            <CardDescription>Total Pendingan</CardDescription>
            <CardTitle>{totalPendingItems} Pcs</CardTitle>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader><CardTitle>Daftar Item Pesanan</CardTitle></CardHeader>
                <CardContent>
                    {items.map(item => (
                        <div key={item.order_item_id} className="flex items-center gap-4 py-2 border-b last:border-b-0">
                           <div className="flex-grow">
                                <p className="font-medium text-sm">{item.nama_produk}</p>
                                <p className="text-xs text-muted-foreground">{item.series_produk} - {item.gramasi_produk}</p>
                           </div>
                           <div className="text-sm text-right"><p className="font-semibold">{item.quantity_shipped} / {item.quantity}</p><p className="text-xs text-muted-foreground">Terkirim</p></div>
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Riwayat Pengiriman & Bukti</CardTitle></CardHeader>
                <CardContent>
                    {shipments.length > 0 ? shipments.map(ship => (
                        <div key={ship.shipment_id} className="py-3 border-b last:border-b-0">
                           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                               <div>
                                    <span className="font-medium">Pengiriman #{ship.shipment_id}</span>
                                    <span className="text-muted-foreground text-xs ml-2">{new Date(ship.created_at).toLocaleDateString('id-ID')}</span>
                               </div>
                               <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`capitalize px-2 py-1 text-xs font-semibold rounded-full ${ship.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{ship.status}</span>
                                    {ship.admin_proof_url && (
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href={`${API_URL}/${ship.admin_proof_url}`} target="_blank">
                                                <FileText className="mr-2 h-3 w-3"/>
                                                Lihat Bukti
                                            </Link>
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => handlePrintLabel(ship.shipment_id)}>
                                        <Printer className="mr-2 h-3 w-3"/>
                                        Cetak Label
                                    </Button>
                               </div>
                           </div>
                           <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 pl-4">
                                {(ship.items || []).map((item, index) => (
                                    <li key={index}>{item.quantity}x {item.nama_produk} ({item.series_produk} - {item.gramasi_produk})</li>
                                ))}
                           </ul>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center p-4">Belum ada pengiriman.</p>}
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Buat Pengiriman Baru</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {order.payment_proof_url && (
                            <div className="pb-4 border-b">
                                <Label>Bukti Pembayaran Bandar</Label>
                                <Button asChild variant="link" className="p-0 h-auto w-full justify-start">
                                    <Link href={`${API_URL}/${order.payment_proof_url}`} target="_blank">
                                        Lihat Bukti Pembayaran
                                    </Link>
                                </Button>
                            </div>
                        )}

                        <p className="text-sm text-muted-foreground pt-2">Pilih item yang akan dikirim dalam paket ini.</p>
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                            {items.filter(item => item.quantity > item.quantity_shipped).length > 0 ? (
                                items.map(item => (<ShippableItem key={item.order_item_id} item={item} onSelectionChange={(selected, quantity) => handleSelectionChange(item.order_item_id, item.produk_id, selected, quantity)}/>))
                            ) : <p className="text-sm text-center text-green-600 p-4">Semua item telah dikirim.</p>}
                        </div>

                        {itemsToShip.size > 0 && (
                            <div className="pt-4 border-t space-y-2">
                                <Label htmlFor="proofFile">Unggah Bukti Foto Paket</Label>
                                <Input id="proofFile" type="file" onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)} />
                            </div>
                        )}

                        <Button className="w-full" onClick={handleCreateShipment} disabled={isSubmitting || itemsToShip.size === 0}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                            Buat & Kirim Paket ({itemsToShip.size} item)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

