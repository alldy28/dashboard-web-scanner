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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CartContentsProps {
  cart: CartItem[];
  notes: string;
  totalPrice: number;
  isSubmitting: boolean;
  handleUpdateQuantity: (productId: number, newQuantity: number) => void;
  handleCreateOrder: (confirmPo: boolean) => void;
  setNotes: (notes: string) => void;
  formatCurrency: (value: number) => string;
  API_URL: string;
}

const CartContents: React.FC<CartContentsProps> = ({
  cart,
  notes,
  totalPrice,
  isSubmitting,
  handleUpdateQuantity,
  handleCreateOrder,
  setNotes,
  formatCurrency,
  API_URL,
}) => (
  <>
    {/* Items Section - Scrollable */}
    <div className="overflow-y-auto px-4 mb-4">
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
                <p className="text-sm font-medium leading-tight">{item.name}</p>
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
                <span className="w-8 text-center text-sm">{item.quantity}</span>
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

    {/* Footer Section - Always Visible */}
    {cart.length > 0 && (
      <div className="border-t border-gray-100 dark:border-gray-800 space-y-4 px-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Catatan untuk Admin{" "}
            <span className="text-gray-400">(Opsional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Contoh: Kirim ke alamat kantor, bukan rumah..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-16 bg-white dark:bg-gray-800 text-sm resize-none"
          />
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>

        <Button
          className="w-full"
          onClick={() => handleCreateOrder(false)}
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Lanjut ke Pembayaran
        </Button>
      </div>
    )}
  </>
);

export default function OrderProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [isStoreStatusLoading, setIsStoreStatusLoading] = useState(true);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poDetails, setPoDetails] = useState({ message: "", totalPrice: 0 });

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const STATUS_API_URL = `${API_URL}/api/store-status`;

  // ✅ Check Store Status
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
  }, [STATUS_API_URL]);

  // ✅ Fetch Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("bandar_access_token");

    // ✅ PERBAIKI: Cek token
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setIsLoading(false);
      return;
    }

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

  useEffect(() => {
    if (storeStatus?.isOpen) {
      fetchProducts();
    } else if (!isStoreStatusLoading) {
      setIsLoading(false);
    }
  }, [fetchProducts, storeStatus, isStoreStatusLoading]);

  // ✅ Add to Cart
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
          price: parseFloat(product.harga_bandar) || 0,
          image: product.upload_gambar,
        },
      ];
    });
  };

  // ✅ Update Quantity
  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    // ✅ PERBAIKI: Validasi quantity
    if (newQuantity < 0) {
      toast.error("Quantity tidak boleh negatif");
      return;
    }

    setCart((prevCart) => {
      if (newQuantity === 0) {
        return prevCart.filter((item) => item.produk_id !== productId);
      }
      return prevCart.map((item) =>
        item.produk_id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  // ✅ Create Order
  const handleCreateOrder = async (confirmPo = false) => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong.");
      return;
    }

    // ✅ PERBAIKI: Cek token
    const token = localStorage.getItem("bandar_access_token");
    if (!token) {
      toast.error("Sesi Anda telah habis. Silakan login ulang.");
      router.push("/bandar-login");
      return;
    }

    setIsSubmitting(true);
    setError(null);
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
          notes: notes,
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

        try {
          // ✅ TAMBAHAN: Direct ke WhatsApp admin
          const invoiceLink = `${window.location.origin}/dashboard/orders/${data.orderId}/invoice`;
          const waMessage = `Halo Admin, saya sudah melakukan order. Mohon di cek pesanan saya:\n\n📄 Invoice: ${invoiceLink}\n\nTerimakasih!`;
          const encodedMessage = encodeURIComponent(waMessage);

          // Ambil nomor admin dari environment variable
          const adminPhone =
            process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_PHONE || "6281222224489";

          console.log("Admin Phone:", adminPhone);
          console.log(
            "WhatsApp URL:",
            `https://wa.me/${adminPhone}?text=${encodedMessage}`
          );

          // Buka WhatsApp setelah 1 detik
          setTimeout(() => {
            window.open(
              `https://wa.me/${adminPhone}?text=${encodedMessage}`,
              "_blank"
            );
          }, 1000);
        } catch (err) {
          console.error("WhatsApp error:", err);
        }

        setNotes("");
        setCart([]);
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

  // ✅ Filters & Calculations
  const filteredProducts = products.filter(
    (p) =>
      p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.series_produk &&
        p.series_produk.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  // Status Display
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

  return (
    <div className="h-screen flex flex-col p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4 flex-shrink-0">
        Buat Pesanan Stok
      </h1>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden mb-20 md:mb-0">
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
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" /> Keranjang
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col p-4 md:p-6 overflow-hidden">
            <CartContents
              cart={cart}
              notes={notes}
              totalPrice={totalPrice}
              isSubmitting={isSubmitting}
              handleUpdateQuantity={handleUpdateQuantity}
              handleCreateOrder={handleCreateOrder}
              setNotes={setNotes}
              formatCurrency={formatCurrency}
              API_URL={API_URL}
            />
          </CardContent>
        </Card>
      </div>

      {/* Keranjang Mobile - Floating Button + Sheet (DIPERBAIKI) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl p-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full py-3 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>Keranjang</span>
              {totalItems > 0 && (
                <Badge className="ml-2 bg-red-500 text-white px-2 py-0.5 text-xs">
                  {totalItems}
                </Badge>
              )}
              <span className="ml-auto font-bold">
                {formatCurrency(totalPrice)}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="md:hidden rounded-t-3xl flex flex-col max-h-[80vh]"
          >
            <SheetHeader className="flex-shrink-0 mb-4 px-4">
              <SheetTitle className="text-xl">Keranjang Belanja</SheetTitle>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto">
              <CartContents
                cart={cart}
                notes={notes}
                totalPrice={totalPrice}
                isSubmitting={isSubmitting}
                handleUpdateQuantity={handleUpdateQuantity}
                handleCreateOrder={handleCreateOrder}
                setNotes={setNotes}
                formatCurrency={formatCurrency}
                API_URL={API_URL}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Modal Konfirmasi PO */}
      <Dialog open={poModalOpen} onOpenChange={setPoModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 w-[90%] rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pre-Order</DialogTitle>
            <DialogDescription>
              {poDetails.message} Total estimasi belanja Anda adalah
              <strong> {formatCurrency(poDetails.totalPrice)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setPoModalOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button onClick={handleConfirmPo} className="flex-1">
              Ya, Lanjutkan Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
