"use client"; // Diperlukan untuk menggunakan hooks (useState, useEffect)

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// --- Konfigurasi ---
const API_BASE_URL = "https://apiv2.silverium.id"; // Ganti dengan URL API production Anda jika perlu

// --- Tipe Data ---
type Product = {
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  harga_produk: string;
  harga_buyback: string | null;
  upload_gambar: string | null;
};

type LastUpdate = {
  tanggal_update: string | null;
};

// --- Komponen Detail Row (untuk di dalam Modal) ---
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-semibold text-gray-800 dark:text-gray-200 text-right">
      {value}
    </p>
  </div>
);

// --- Komponen Utama Halaman ---
export default function HargaSilveriumPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lastUpdateData, setLastUpdateData] = useState<LastUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk modal detail
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const productsRes = await fetch(`${API_BASE_URL}/api/produk/public`, {
        cache: "no-store",
      });
      if (!productsRes.ok) throw new Error("Gagal mengambil data produk.");
      const productsData = await productsRes.json();
      setProducts(productsData);

      const lastUpdateRes = await fetch(`${API_BASE_URL}/api/harga-terakhir`, {
        cache: "no-store",
      });
      if (!lastUpdateRes.ok) throw new Error("Gagal mengambil tanggal update.");
      const lastUpdate = await lastUpdateRes.json();
      setLastUpdateData(lastUpdate);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan tidak diketahui."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: string | null | undefined) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
      return "N/A";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Belum ada update";
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
        <main className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
              Daftar Harga Silverium
            </h1>
            <p className="text-muted-foreground mt-2">
              Harga diperbarui secara real-time.
            </p>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Pricelist Produk</CardTitle>
              <CardDescription>
                Update Terakhir:{" "}
                {isLoading
                  ? "Memuat..."
                  : formatDate(lastUpdateData?.tanggal_update || null)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <p className="col-span-1 md:col-span-2 text-center text-muted-foreground py-8">
                    Memuat produk...
                  </p>
                ) : error ? (
                  <p className="col-span-1 md:col-span-2 text-center text-red-500 py-8">
                    {error}
                  </p>
                ) : products.length > 0 ? (
                  products.map((product, index) => (
                    <button
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left w-full"
                      onClick={() => handleProductClick(product)}
                    >
                      <Image
                        src={
                          product.upload_gambar
                            ? `${API_BASE_URL}/${product.upload_gambar}`
                            : "https://placehold.co/100x100"
                        }
                        alt={product.nama_produk}
                        width={64}
                        height={64}
                        className="h-16 w-16 object-cover rounded-md border"
                        unoptimized
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">
                          {product.nama_produk}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {product.series_produk} - {product.gramasi_produk}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-lg text-gray-900 dark:text-white">
                          {formatCurrency(product.harga_produk)}
                        </p>
                        <Badge variant="outline">
                          Buyback: {formatCurrency(product.harga_buyback)}
                        </Badge>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="col-span-1 md:col-span-2 text-center text-muted-foreground py-8">
                    Tidak ada produk yang tersedia saat ini.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modal untuk Detail Produk */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-gray-900 dark:text-white">
                  {selectedProduct.nama_produk}
                </DialogTitle>
                <DialogDescription>
                  {selectedProduct.series_produk} -{" "}
                  {selectedProduct.gramasi_produk}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Image
                  src={
                    selectedProduct.upload_gambar
                      ? `${API_BASE_URL}/${selectedProduct.upload_gambar}`
                      : "https://placehold.co/400x400"
                  }
                  alt={selectedProduct.nama_produk}
                  width={400}
                  height={400}
                  className="w-full h-auto max-h-64 object-cover rounded-lg mb-4"
                  unoptimized
                />
                <div className="space-y-2">
                  <DetailRow
                    label="Harga Jual"
                    value={formatCurrency(selectedProduct.harga_produk)}
                  />
                  <DetailRow
                    label="Harga Buyback"
                    value={formatCurrency(selectedProduct.harga_buyback)}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Tutup
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
