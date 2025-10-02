"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";
const ITEMS_PER_PAGE = 10;

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

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-semibold text-gray-800 dark:text-gray-200 text-right">
      {value}
    </p>
  </div>
);

export default function HargaSilveriumPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lastUpdateData, setLastUpdateData] = useState<LastUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, lastUpdateRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/produk/public`, { cache: "no-store" }),
        fetch(`${API_BASE_URL}/api/harga-terakhir`, { cache: "no-store" }),
      ]);

      if (!productsRes.ok) throw new Error("Gagal mengambil data produk.");
      if (!lastUpdateRes.ok) throw new Error("Gagal mengambil tanggal update.");

      let productsData: Product[] = await productsRes.json();
      const lastUpdate = await lastUpdateRes.json();

      productsData = productsData.filter(
        (p) => p.series_produk !== "Silver Custom"
      );

      setProducts(productsData);
      setLastUpdateData(lastUpdate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uniqueSeries = useMemo(() => {
    if (products.length === 0) return [];
    const seriesSet = new Set(products.map((p) => p.series_produk));
    return ["All", ...Array.from(seriesSet)];
  }, [products]);

  const processedProducts = useMemo(() => {
    let filtered = products;

    if (selectedSeries !== "All") {
      filtered = filtered.filter((p) => p.series_produk === selectedSeries);
    }

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filtered.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    return {
      paginatedItems,
      totalPages,
      totalFilteredCount: filtered.length,
    };
  }, [products, selectedSeries, searchTerm, currentPage]);

  const handleSeriesChange = (series: string) => {
    setSelectedSeries(series);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatCurrency = (value: string | null | undefined | number) => {
    const numValue = Number(value);
    if (value === null || value === undefined || isNaN(numValue)) {
      return "N/A";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Belum ada update";
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  const calculateAdjustedBuyback = (product: Product | null): number | null => {
    if (
      !product ||
      product.harga_buyback === null ||
      product.harga_buyback === undefined
    ) {
      return null;
    }
    const buybackValue = parseFloat(product.harga_buyback);
    if (isNaN(buybackValue)) {
      return null;
    }
    if (product.series_produk !== "Silver Bullion") {
      const weightMatch = String(product.gramasi_produk).match(/[\d.]+/);
      const weight = weightMatch ? parseFloat(weightMatch[0]) : 0;
      if (weight > 0) {
        const pricePerGram = buybackValue / weight;
        const adjustedPricePerGram = pricePerGram + 600;
        return adjustedPricePerGram * weight;
      }
    }
    return buybackValue;
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

          <div className="mb-6 space-y-4">
            <Input
              placeholder="Cari nama produk..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full max-w-sm mx-auto"
            />
            <div className="flex flex-wrap justify-center gap-2">
              {uniqueSeries.map((series) => (
                <Button
                  key={series}
                  variant={selectedSeries === series ? "default" : "outline"}
                  onClick={() => handleSeriesChange(series)}
                >
                  {series}
                </Button>
              ))}
            </div>
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
                ) : processedProducts.paginatedItems.length > 0 ? (
                  processedProducts.paginatedItems.map((product, index) => (
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
                          Buyback:{" "}
                          {formatCurrency(calculateAdjustedBuyback(product))}
                        </Badge>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="col-span-1 md:col-span-2 text-center text-muted-foreground py-8">
                    Tidak ada produk yang cocok dengan kriteria pencarian.
                  </p>
                )}
              </div>
            </CardContent>
            {processedProducts.totalPages > 1 && (
              <CardFooter className="flex justify-between items-center pt-4">
                <span className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {processedProducts.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, processedProducts.totalPages)
                      )
                    }
                    disabled={currentPage === processedProducts.totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </main>
      </div>
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
                    value={formatCurrency(
                      calculateAdjustedBuyback(selectedProduct)
                    )}
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
