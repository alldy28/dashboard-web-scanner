"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation"; // Impor useRouter
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Package,
  Calendar,
  User,
  Hash,
  Upload,
  CheckCircle,
  ExternalLink,
  Info, // Icon baru
} from "lucide-react";
// Impor komponen AlertDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Tipe Data ---
type ShipmentItem = {
  nama_produk: string;
  quantity: number;
};
type Shipment = {
  shipment_id: number;
  status: string;
  created_at: string;
  items: ShipmentItem[];
  admin_proof_url: string | null;
};
type OrderItem = {
  nama_produk: string;
  gramasi_produk: string;
  upload_gambar: string | null;
  quantity: number;
  price_at_order: string;
};
// PERBAIKAN: Status dibuat lebih spesifik
type OrderStatus =
  | "pending-payment"
  | "pre-order-pending-payment"
  | "pending"
  | "approved"
  | "in_transit"
  | "completed"
  | "rejected";

type OrderDetails = {
  order: {
    order_id: number;
    bandar_name: string;
    status: OrderStatus;
    total_price: string;
    created_at: string;
    expires_at: string | null;
    payment_proof_url: string | null;
  };
  items: OrderItem[];
  shipments: Shipment[];
};

// --- Helper ---
// PENAMBAHAN: Mapping untuk status yang user-friendly
const STATUS_MAP: Record<OrderStatus, string> = {
  "pending-payment": "Menunggu Pembayaran",
  "pre-order-pending-payment": "Menunggu Pembayaran (PO)", // DITAMBAHKAN
  pending: "Menunggu Konfirmasi",
  approved: "Pembayaran Diterima",
  in_transit: "Dalam Pengiriman",
  completed: "Selesai",
  rejected: "Dibatalkan / Kedaluwarsa",
};

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value));

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// --- Komponen Anak ---
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="flex items-start justify-between py-2">
    <div className="flex items-center text-sm text-muted-foreground">
      {icon}
      <span className="ml-2">{label}</span>
    </div>
    <span className="font-semibold text-sm text-right">{value}</span>
  </div>
);

// --- Komponen PaymentForm (Logika Upload DIPERBAIKI) ---
const PaymentForm = ({
  order,
  onPaymentSuccess,
}: {
  order: OrderDetails["order"];
  onPaymentSuccess: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("Menghitung waktu...");

  useEffect(() => {
    // 1. Cek status order DULU.
    // Jika order sudah tidak pending, tidak perlu ada timer.
    if (order.status !== 'pending-payment' && order.status !== 'pre-order-pending-payment') {
        if (order.status === 'rejected') {
            setTimeLeft("Pesanan ini telah dibatalkan.");
        } else if (order.status === 'approved' || order.status === 'completed' || order.status === 'in_transit') {
            setTimeLeft("Pembayaran telah dikonfirmasi.");
        }
        return; // Hentikan effect, jangan jalankan interval
    }

    // 2. Cek batas waktu jika status masih pending
    if (!order.expires_at) {
        setTimeLeft("Batas waktu tidak ditentukan.");
        return; // Hentikan effect
    }

    // 3. Jalankan interval
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(order.expires_at!).getTime();
        const distance = expiry - now;

        // 4. Handle jika waktu habis
        if (distance < 0) {
            setTimeLeft("Waktu pembayaran telah habis.");
            clearInterval(interval);
            
            // OPSIONAL TAPI SANGAT DISARANKAN:
            // Panggil fungsi untuk refresh data order dari API.
            // Ini akan menjalankan logika 'lazy update' di backend 
            // dan mengubah status di UI menjadi 'rejected'.
            // refreshOrder(); 
            return;
        }

        // 5. Hitung sisa waktu
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // PERBAIKAN: Gunakan 'd' (detik) dan tambahkan padding 
        // agar tampilan selalu 2 digit (misal: 02j 05m 09d)
        setTimeLeft(
            `${String(hours).padStart(2, '0')}j ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}d`
        );

    }, 1000);

    // Cleanup interval saat component unmount atau dependencies berubah
    return () => clearInterval(interval);

// PENTING: Tambahkan order.status sebagai dependency
}, [order.expires_at, order.status]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Silakan pilih file bukti pembayaran.");
      return;
    }
    setIsLoading(true);

    // PERBAIKAN: Cek token di sini
    const token = localStorage.getItem("bandar_access_token");
    if (!token) {
      toast.error("Sesi habis, silakan login ulang.");
      setIsLoading(false);
      // Arahkan ke login
      window.location.href = "/bandar-login"; // Ganti dengan halaman login bandar Anda
      return;
    }

    const formData = new FormData();
    formData.append("payment_proof", file); // PERBAIKAN: Key harus 'payment_proof'
    formData.append("orderId", order.order_id.toString()); // PERBAIKAN: Kirim 'orderId' di body

    try {
      // PERBAIKAN: Sesuaikan API endpoint dan method
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bandar/orders/upload-proof`,
        {
          method: "POST", // PERBAIKAN: Method POST
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengunggah bukti.");
      }
      toast.success(
        "Bukti pembayaran berhasil diunggah! Pesanan Anda sedang diproses."
      );
      onPaymentSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selesaikan Pembayaran</CardTitle>
        <CardDescription>
          Total pesanan Anda adalah{" "}
          <span className="font-bold">{formatCurrency(order.total_price)}</span>
          . Unggah bukti sebelum waktu habis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* PENAMBAHAN: Info Rekening Pembayaran */}
        <div className="mb-4 rounded-lg border bg-background p-4">
          <h4 className="mb-2 flex items-center text-sm font-semibold">
            <Info className="mr-2 h-4 w-4" />
            Info Rekening Pembayaran
          </h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Bank BCA: <strong>6790326812</strong> (a/n EDI HERMANTO)
            </p>
          </div>
        </div>

        <div className="text-center font-semibold text-destructive mb-4">
          {timeLeft}
        </div>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="paymentUpload">Unggah Bukti Transfer</Label>
            <Input
              id="paymentUpload"
              type="file"
              required
              accept="image/*"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || timeLeft.includes("habis")}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Konfirmasi Pembayaran
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// --- Komponen ShipmentCard (UX Konfirmasi DIPERBAIKI) ---
const ShipmentCard = ({
  shipment,
  onConfirm,
}: {
  shipment: Shipment;
  onConfirm: (shipmentId: number) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  // State 'shipmentIdInput' DIHAPUS
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const handleConfirm = async () => {
    // Pengecekan input DIHAPUS
    setIsLoading(true);
    await onConfirm(shipment.shipment_id);
    // setIsLoading(false); // Biarkan parent yang handle loading state
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-md">
            Pengiriman #{shipment.shipment_id}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {new Date(shipment.created_at).toLocaleDateString("id-ID")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium mb-2">Item dalam paket ini:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mb-4">
          {shipment.items.map((item, i) => (
            <li key={i}>
              {item.quantity}x {item.nama_produk}
            </li>
          ))}
        </ul>

        {shipment.admin_proof_url && (
          <div className="mt-4 pt-4 border-t">
            <a
              href={`${API_URL}/${shipment.admin_proof_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Lihat Bukti Paket dari Pusat
            </a>
          </div>
        )}

        {/* PERBAIKAN: Mengganti Input manual dengan AlertDialog */}
        {shipment.status === "in_transit" && (
          <div className="space-y-2 pt-4 border-t mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Konfirmasi Terima Paket
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Penerimaan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin telah menerima paket pengiriman dengan ID
                    #{shipment.shipment_id}? Stok Anda akan otomatis bertambah.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirm}>
                    Ya, Saya Sudah Terima
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {shipment.status === "received" && (
          <p className="text-sm text-center font-medium text-green-600 p-2 bg-green-50 rounded-md mt-4 border-t pt-4">
            Paket ini sudah diterima.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// --- Komponen Halaman Utama ---
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter(); // PENAMBAHAN: Untuk redirect
  const orderId = params.orderId as string;
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    // PERBAIKAN: Cek token di sini untuk mengatasi 'jwt malformed'
    const token = localStorage.getItem("bandar_access_token");
    if (!token) {
      toast.error("Sesi Anda telah habis. Silakan login kembali.");
      router.push("/bandar-login"); // Ganti dengan halaman login bandar Anda
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bandar/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        // Jika token ditolak oleh server
        if (res.status === 401 || res.status === 403) {
          toast.error("Otentikasi gagal. Silakan login kembali.");
          router.push("/bandar-login"); // Ganti dengan halaman login bandar Anda
          return;
        }
        throw new Error(errData.error || "Gagal memuat detail pesanan.");
      }
      const data: OrderDetails = await res.json();
      setOrderDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, API_URL, router]); // Tambahkan router ke dependencies

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleConfirmReceipt = async (shipmentId: number) => {
    // PERBAIKAN: Cek token di sini
    const token = localStorage.getItem("bandar_access_token");
    if (!token) {
      toast.error("Sesi Anda telah habis. Silakan login kembali.");
      router.push("/bandar-login"); // Ganti dengan halaman login bandar Anda
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/bandar/shipments/${shipmentId}/receive`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal konfirmasi.");
      }
      toast.success(`Pengiriman #${shipmentId} berhasil dikonfirmasi.`);
      fetchOrderDetails(); // Muat ulang data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!orderDetails)
    return <p className="p-6">Detail pesanan tidak ditemukan.</p>;

  const { order, items = [], shipments = [] } = orderDetails;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/bandar-dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">
          Detail Pesanan #{order.order_id}
        </h1>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Image
                        src={
                          item.upload_gambar
                            ? `${API_URL}/${item.upload_gambar}`
                            : `https://placehold.co/80x80/e2e8f0/cccccc.png?text=${encodeURIComponent(
                                item.nama_produk
                              )}`
                        }
                        alt={item.nama_produk}
                        width={80}
                        height={80}
                        className="rounded-md border bg-muted"
                      />
                      <div className="flex-grow">
                        <p className="font-semibold">{item.nama_produk}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.gramasi_produk}
                        </p>
                        <p className="text-sm">
                          {item.quantity} x{" "}
                          {formatCurrency(item.price_at_order)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(
                          item.quantity * Number(item.price_at_order)
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Rincian item akan muncul di sini.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sembunyikan 'Paket Pengiriman' jika pembayaran masih tertunda atau ditolak */}
          {order.status !== "pending-payment" &&
            order.status !== "pre-order-pending-payment" && // DITAMBAHKAN
            order.status !== "rejected" && (
              <Card>
                <CardHeader>
                  <CardTitle>Paket Pengiriman</CardTitle>
                  <CardDescription>
                    Daftar paket yang dikirim dari pusat untuk pesanan ini.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {shipments.length > 0 ? (
                    shipments.map((ship) => (
                      <ShipmentCard
                        key={ship.shipment_id}
                        shipment={ship}
                        onConfirm={handleConfirmReceipt}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-center text-muted-foreground p-4">
                      Admin sedang menyiapkan pesanan Anda.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                icon={<Hash className="h-4 w-4" />}
                label="ID Pesanan"
                value={`#${order.order_id}`}
              />
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Nama Bandar"
                value={order.bandar_name}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Tanggal Pesan"
                value={formatDate(order.created_at)}
              />
              <InfoRow
                icon={<Package className="h-4 w-4" />}
                label="Status Pesanan"
                // PERBAIKAN: Gunakan status yang user-friendly
                value={
                  <span className="font-bold">
                    {STATUS_MAP[order.status] || order.status}
                  </span>
                }
              />
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">
                  {formatCurrency(order.total_price)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Logika Tampilan Kartu Kondisional */}
          {/* PERBAIKAN: Tampilkan form jika 'pending-payment' ATAU 'pre-order-pending-payment' */}
          {["pending-payment", "pre-order-pending-payment"].includes(
            order.status
          ) ? (
            <PaymentForm order={order} onPaymentSuccess={fetchOrderDetails} />
          ) : order.status === "rejected" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">
                  Pesanan Dibatalkan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pesanan ini telah dibatalkan atau kedaluwarsa karena melewati
                  batas waktu pembayaran.
                </p>
              </CardContent>
            </Card>
          ) : order.payment_proof_url ? (
            <Card>
              <CardHeader>
                <CardTitle>Bukti Pembayaran Anda</CardTitle>
              </CardHeader>
              <CardContent>
                <Image
                  src={`${API_URL}/${order.payment_proof_url}`}
                  alt="Bukti Bayar"
                  width={300}
                  height={200}
                  className="rounded-md border w-full h-auto" // Buat gambar responsif
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
