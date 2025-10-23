"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
// BARU: Impor untuk keranjang mobile
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Store,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// ... (Tipe data Anda: Product, CartItem, StoreStatus - tidak berubah) ...
// Tipe Data
type Product = {
  id_produk: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  harga_bandar: string;
  upload_gambar: string | null;
};

type CartItem = {
  produk_id: number;
  quantity: number;
  name: string;
  price: number;
  image: string | null;
};

type StoreStatus = {
  isOpen: boolean;
  message: string;
};

export default function OrderProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [isStoreStatusLoading, setIsStoreStatusLoading] = useState(true);

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poDetails, setPoDetails] = useState({ message: "", totalPrice: 0 });

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const STATUS_API_URL = `${API_URL}/api/store-status`;

  // ... (Semua useEffect dan functions Anda: checkStoreStatus, fetchProducts, handleAddToCart, handleUpdateQuantity, handleCreateOrder, handleConfirmPo - tidak berubah) ...

  // BARU: useEffect untuk mengecek status toko saat halaman dimuat
  useEffect(() => {
    const checkStoreStatus = async () => {
      try {
        const res = await fetch(STATUS_API_URL);
        if (!res.ok) throw new Error("Gagal memeriksa status toko");
        const data: StoreStatus = await res.json();
        setStoreStatus(data);
      } catch (err) {
        setStoreStatus({
          isOpen: false,
          message:
            err instanceof Error ? err.message : "Gagal terhubung ke server",
        });
      } finally {
        setIsStoreStatusLoading(false);
      }
    };
    checkStoreStatus();
  }, [STATUS_API_URL]); // Hanya berjalan sekali

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Reset error state on fetch
    const token = localStorage.getItem("bandar_access_token");
    try {
      const res = await fetch(`${API_URL}/api/bandar/products-for-order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal memuat produk.");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // MODIFIKASI: useEffect ini sekarang bergantung pada status toko
  useEffect(() => {
    // Hanya panggil fetchProducts jika toko BUKA
    if (storeStatus?.isOpen) {
      fetchProducts();
    } else if (!isStoreStatusLoading) {
      // Jika toko tutup (dan status sudah selesai dicek), pastikan loading produk dihentikan
      setIsLoading(false);
    }
  }, [fetchProducts, storeStatus, isStoreStatusLoading]);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.produk_id === product.id_produk
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.produk_id === product.id_produk
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          produk_id: product.id_produk,
          quantity: 1,
          name: product.nama_produk,
          price: parseFloat(product.harga_bandar) || 0, // DIPERBARUI: Menggunakan harga_bandar
          image: product.upload_gambar,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.produk_id !== productId);
      }
      return prevCart.map((item) =>
        item.produk_id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const handleCreateOrder = async (confirmPo = false) => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem("bandar_access_token");

    try {
      const res = await fetch(`${API_URL}/api/bandar/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: cart.map(({ produk_id, quantity }) => ({
            produk_id,
            quantity,
          })),
          confirmPo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan.");

      if (data.status === "pre-order-required") {
        setPoDetails({ message: data.message, totalPrice: data.totalPrice });
        setPoModalOpen(true);
      } else if (data.status === "payment-pending") {
        toast.success(
          `Pesanan #${data.orderId} dibuat! Anda akan diarahkan ke halaman pembayaran.`
        );
        router.push(`/bandar-dashboard/orders/${data.orderId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPo = () => {
    setPoModalOpen(false);
    handleCreateOrder(true);
  };

  // ... (filteredProducts - tidak berubah) ...
  const filteredProducts = products.filter(
    (p) =>
      p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.series_produk &&
        p.series_produk.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // MODIFIKASI: Dibuat 2 memo, 1 untuk total, 1 untuk jumlah item
  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // ... (formatCurrency - tidak berubah) ...
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  // --- RENDER LOGIC DIPERBARUI ---
  // (Tampilan loading dan toko tutup tidak berubah)

  if (isStoreStatusLoading) {
    return (
      <div className="p-10 flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-lg">Memeriksa status toko...</p>
      </div>
    );
  }

  if (!storeStatus?.isOpen) {
    return (
      <div className="p-10 flex flex-col justify-center items-center h-screen text-center">
        <Store className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Pemesanan Ditutup</h1>
        <p className="text-lg mt-2 text-gray-600 dark:text-gray-400">
          {storeStatus?.message || "Toko sedang tidak beroperasi."}
        </p>
        <p className="mt-1 text-gray-500">Silakan kembali lagi nanti.</p>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="p-10 flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-lg">Memuat produk...</p>
      </div>
    );

  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  // --- BARU: Komponen Internal untuk Isi Keranjang ---
  // Didefinisikan di sini agar bisa di-reuse di Desktop dan Mobile
  // Punya akses ke state (cart) dan functions (handleUpdateQuantity, dll)
  const CartContents = () => (
    <>
      {/* Div untuk scrolling list item */}
      <div className="flex-grow overflow-y-auto mb-4 pr-3 -mr-3">
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
            Keranjang kosong.
          </p>
        ) : (
          cart.map((item) => (
            <div
              key={item.produk_id}
              className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <Image
                src={
                  item.image
                    ? `${API_URL}/${item.image}`
                    : `https://placehold.co/64x64/e2e8f0/cccccc?text=PIC`
                }
                alt={item.name}
                width={48}
                height={48}
                className="rounded-md border flex-shrink-0 bg-gray-100 dark:bg-gray-700"
              />
              <div className="flex-grow flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm font-medium leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      handleUpdateQuantity(item.produk_id, item.quantity - 1)
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      handleUpdateQuantity(item.produk_id, item.quantity + 1)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Div untuk footer (Total & Tombol Bayar) */}
      {cart.length > 0 && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Total</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => handleCreateOrder(false)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lanjut ke Pembayaran
          </Button>
        </div>
      )}
    </>
  );

  // 5. Tampilkan halaman order (jika toko BUKA dan produk sukses dimuat)
  return (
    // Container utama dibuat full screen dan menggunakan flexbox kolom
    <div className="h-screen flex flex-col p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4 flex-shrink-0">
        Buat Pesanan Stok
      </h1>

      {/* Grid container dibuat fleksibel dan mengambil sisa ruang */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* Kolom Produk (md:col-span-2) */}
        {/* Tetap flex kolom dan overflow-hidden */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                className="pl-8 bg-white dark:bg-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-4 md:p-6">
            {/* Menggunakan div biasa untuk scroll produk */}
            <div className="h-full overflow-y-auto pr-3 -mr-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id_produk}
                    className="overflow-hidden cursor-pointer hover:border-primary transition-all bg-white dark:bg-gray-800"
                    onClick={() => handleAddToCart(product)}
                  >
                    <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
                      <Image
                        src={
                          product.upload_gambar
                            ? `${API_URL}/${product.upload_gambar}`
                            : `https://placehold.co/150x150/e2e8f0/cccccc?text=${product.nama_produk}`
                        }
                        alt={product.nama_produk}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-xs font-semibold truncate">
                        {product.nama_produk}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.gramasi_produk}
                      </p>
                      <p className="text-sm font-bold mt-1 text-primary">
                        {formatCurrency(parseFloat(product.harga_bandar) || 0)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>{" "}
            {/* Akhir div scroll produk */}
          </CardContent>
        </Card>

        {/* --- MODIFIKASI: Kolom Keranjang (HANYA DESKTOP) --- */}
        {/* Disembunyikan di mobile, tampil sebagai flex di desktop */}
        <Card className="hidden md:flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" /> Keranjang
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col p-4 md:p-6 overflow-hidden">
            {/* Menggunakan Komponen Internal */}
            <CartContents />
          </CardContent>
        </Card>
      </div>

      {/* --- BARU: Tombol Keranjang & Sheet (HANYA MOBILE) --- */}
      {/* Tampil di mobile, sembunyi di desktop */}
      <div className="md:hidden sticky bottom-0 bg-background p-4 border-t border-border shadow-lg">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full" size="lg">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-semibold">Lihat Keranjang</span>
                  {totalItems > 0 && (
                    <Badge variant="secondary" className="px-2 py-0.5 text-sm">
                      {totalItems}
                    </Badge>
                  )}
                </div>
                <span className="font-bold">{formatCurrency(totalPrice)}</span>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Keranjang Anda</SheetTitle>
            </SheetHeader>
            {/* Konten Sheet dibuat scrollable */}
            <div className="flex-grow flex flex-col overflow-hidden p-4">
              {/* Menggunakan Komponen Internal */}
              <CartContents />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Dialog Konfirmasi PO (tidak berubah) */}
      <Dialog open={poModalOpen} onOpenChange={setPoModalOpen}>
        {/* ... (isi dialog Anda) ... */}
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pre-Order</DialogTitle>
            <DialogDescription>
              {poDetails.message} Total estimasi belanja Anda adalah
              <strong> {formatCurrency(poDetails.totalPrice)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirmPo}>Ya, Lanjutkan Pesanan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
