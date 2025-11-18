"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

// --- Tipe Data untuk Invoice ---
type OrderItem = {
  produk_id: number;
  nama_produk: string;
  gramasi_produk: string;
  quantity: number;
  price_at_order: number;
};

type ApiOrderItem = {
  produk_id: number;
  nama_produk: string;
  gramasi_produk: string;
  quantity: number;
  price_at_order: string | number;
};

type OrderData = {
  order: {
    order_id: string;
    invoice_id: string;
    created_at: string;
    payment_method: string;
    company_name: string;
    company_address: string;
    bandar_name: string;
    bandar_email: string;
    bandar_phone: string;
    bandar_full_address: string;
    subtotal: number;
    shipping_details: string;
    shipping_cost: number;
    total_price: number;
  };
  items: OrderItem[];
};

// Helper untuk format mata uang
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

// Helper untuk format tanggal
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return "Invalid Date";
  }
};

// --- Komponen Utama Halaman Invoice (ADMIN) ---
export default function AdminInvoicePage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [invoiceData, setInvoiceData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ FIX: Gunakan contentRef (bukan content callback)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${orderId}`,
    onBeforePrint: async () => {
      if (!printRef.current) {
        throw new Error("Ref tidak ter-attach ke element!");
      }
      console.log("Siap print, konten:", printRef.current);
    },
    onAfterPrint: () => {
      console.log("Print selesai");
      toast.success("Print berhasil!");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Gagal print invoice");
    },
  });

  // Efek untuk mengambil data invoice dari API
  useEffect(() => {
    if (!orderId) return;

    const fetchInvoiceData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("admin_access_token");

      try {
        console.log(
          "Fetching from:",
          `${API_URL}/api/admin/orders/${orderId}/invoice`
        );
        console.log("Token:", token ? "Ada" : "Tidak ada");

        const res = await fetch(
          `${API_URL}/api/admin/orders/${orderId}/invoice`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Response status:", res.status);

        if (!res.ok) {
          const errData = await res.json();
          console.error("Error data:", errData);
          throw new Error(errData.error || "Gagal memuat data invoice.");
        }

        const data = await res.json();
        console.log("Invoice data:", data);

        if (!data.order || !data.items) {
          throw new Error("Format data API tidak lengkap untuk invoice.");
        }

        // Transformasi data API ke format OrderData
        const transformedData: OrderData = {
          order: {
            order_id: data.order.order_id,
            invoice_id: data.order.invoice_id || `INV-${data.order.order_id}`,
            created_at: data.order.created_at,
            payment_method:
              data.order.payment_method ||
              "Transfer Manual Upload Bukti pembayaran",

            company_name: data.order.company_name || "Beli MiniGold",
            company_address:
              data.order.company_address || "Alamat Perusahaan Tidak Ditemukan",

            bandar_name: data.order.bandar_name,
            bandar_email: data.order.bandar_email || "N/A",
            bandar_phone: data.order.bandar_phone || "N/A",
            bandar_full_address:
              data.order.bandar_full_address || "Alamat Bandar Tidak Ditemukan",

            subtotal: parseFloat(data.order.subtotal) || data.order.total_price,
            shipping_details:
              data.order.shipping_details ||
              "Akan dibayar ketika barang sampai",
            shipping_cost: parseFloat(data.order.shipping_cost) || 0,
            total_price: parseFloat(data.order.total_price),
          },
          items: data.items.map((item: ApiOrderItem) => ({
            produk_id: item.produk_id,
            nama_produk: item.nama_produk || "Nama Produk Tidak Ditemukan",
            gramasi_produk: item.gramasi_produk || "N/A",
            quantity: item.quantity,
            price_at_order: parseFloat(item.price_at_order as string),
          })),
        };

        setInvoiceData(transformedData);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Terjadi kesalahan.";
        setError(errorMsg);
        toast.error("Gagal Memuat Invoice", { description: errorMsg });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, [orderId, API_URL]);

  // --- Tampilan Loading, Error, dan Data ---

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <p className="text-muted-foreground">
          Pastikan API Anda sudah mengembalikan data invoice.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/dashboard/orders/${orderId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Detail Pesanan
          </Link>
        </Button>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <p>Data invoice tidak ditemukan.</p>
      </div>
    );
  }

  const { order, items } = invoiceData;

  // --- Render Halaman Invoice ---
  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      {/* Tombol Aksi di Atas */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-between gap-2 print:hidden">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/orders/${orderId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setTimeout(() => handlePrint(), 300);
          }}
        >
          <Printer className="mr-2 h-4 w-4" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* Konten Invoice yang Bisa Dicetak */}
      <div
        ref={printRef}
        className="max-w-4xl mx-auto p-8 md:p-12 bg-white rounded-lg shadow-lg text-sm"
        style={{ minHeight: "600px" }}
      >
        {/* Header Invoice */}
        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 uppercase tracking-wide">
              Invoice
            </h1>
            <Image
              src="/logo-Silverium.png"
              alt="Logo Perusahaan"
              width={200}
              height={200}
              className="mt-4 rounded-full"
              priority
            />
          </div>
          <div className="text-right text-xs text-gray-600 max-w-[250px]">
            <p className="font-bold text-base text-black">
              {order.company_name}
            </p>
            <p className="whitespace-pre-line">{order.company_address}</p>
          </div>
        </header>

        {/* Info Alamat dan Detail */}
        <section className="grid grid-cols-3 gap-6 mb-10">
          {/* Billing Address */}
          <div className="col-span-1">
            <h3 className="font-bold text-gray-800 mb-2 border-b pb-1">
              Billing Address:
            </h3>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p className="font-semibold text-black">{order.bandar_name}</p>
              <p className="whitespace-pre-line">{order.bandar_full_address}</p>
              <p className="pt-2">
                <strong>Email:</strong> {order.bandar_email}
              </p>
              <p>
                <strong>Phone:</strong> {order.bandar_phone}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="col-span-1">
            <h3 className="font-bold text-gray-800 mb-2 border-b pb-1">
              Shipping Address:
            </h3>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p className="font-semibold text-black">{order.bandar_name}</p>
              <p className="whitespace-pre-line">{order.bandar_full_address}</p>
            </div>
          </div>

          {/* Info Invoice */}
          <div className="col-span-1 text-right">
            <div className="grid grid-cols-2 text-xs">
              <span className="font-bold text-gray-800">Invoice Date:</span>
              <span>{formatDate(order.created_at)}</span>

              <span className="font-bold text-gray-800">Invoice No.:</span>
              <span>{order.invoice_id}</span>

              <span className="font-bold text-gray-800">Order No.:</span>
              <span>{order.order_id}</span>

              <span className="font-bold text-gray-800">Order Date:</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>
        </section>

        {/* Tabel Item */}
        <section className="mb-10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 text-xs font-bold text-gray-700 uppercase">
                <th className="p-3 w-1/12">S.NO</th>
                <th className="p-3 w-5/12">Product</th>
                <th className="p-3 w-2/12 text-center">Quantity</th>
                <th className="p-3 w-2/12 text-right">Price</th>
                <th className="p-3 w-2/12 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={item.produk_id} className="border-b border-gray-100">
                    <td className="p-3 text-xs">{index + 1}</td>
                    <td className="p-3 text-sm font-medium">
                      {item.nama_produk}
                      <p className="text-xs text-muted-foreground">
                        {item.gramasi_produk}
                      </p>
                    </td>
                    <td className="p-3 text-sm text-center">{item.quantity}</td>
                    <td className="p-3 text-sm text-right">
                      {formatCurrency(item.price_at_order)}
                    </td>
                    <td className="p-3 text-sm text-right">
                      {formatCurrency(item.price_at_order * item.quantity)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">
                    Tidak ada item
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Total dan Footer */}
        <section className="flex justify-between items-start">
          {/* Metode Pembayaran */}
          <div className="text-xs">
            <h4 className="font-bold text-gray-800 mb-1">Payment method:</h4>
            <p className="text-gray-600">{order.payment_method}</p>
          </div>

          {/* Kalkulasi Total */}
          <div className="w-1/3 space-y-2 text-sm">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-800 text-right">
                {formatCurrency(order.shipping_cost)}
                <br />
                <span className="text-gray-500 font-normal">
                  ({order.shipping_details})
                </span>
              </span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2 mt-2">
              <span className="text-black">Total</span>
              <span className="text-blue-600">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
