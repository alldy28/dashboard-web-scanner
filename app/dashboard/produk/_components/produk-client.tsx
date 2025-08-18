"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  PlusCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import ProdukForm from "./produk-form";
import { GenerateQrModal } from "./generate-qr-modal";
import { apiClient } from "@/lib/api";

// Tipe data untuk produk
type Product = {
  id_produk: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  fineness: string;
  harga_produk: string;
  harga_buyback: string | null;
  tahun_pembuatan: number;
  upload_gambar?: string | null;
};

// Tipe untuk respons API yang dipaginasi
type PaginatedProductsResponse = {
  data: Product[];
  currentPage: number;
  totalPages: number;
};

export function ProdukClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchData = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result: PaginatedProductsResponse = await apiClient(
        `/api/produk?page=${page}&search=${search}`
      );
      setProducts(result.data);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
      setProducts([]);
      setCurrentPage(1);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchData(1, searchTerm);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchData]);

  useEffect(() => {
    fetchData(currentPage, searchTerm);
  }, [currentPage, fetchData]);

  const handleOpenFormModal = (product: Product | null) => {
    setSelectedProduct(product);
    setIsFormModalOpen(true);
  };

  const handleOpenQrModal = (product: Product) => {
    setSelectedProduct(product);
    setIsQrModalOpen(true);
  };

  const handleSuccess = () => {
    setIsFormModalOpen(false);
    setIsQrModalOpen(false);
    setSelectedProduct(null);
    fetchData(currentPage, searchTerm);
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?"))
      return;

    try {
      await apiClient(`/api/produk/${productId}`, {
        method: "DELETE",
      });
      alert("Produk berhasil dihapus!");
      fetchData(currentPage, searchTerm);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    }
  };

  const formatCurrency = (value: string | null | undefined | number) => {
    const numValue = Number(value);
    if (value === null || value === undefined || isNaN(numValue)) {
      return "-";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const calculateAdjustedBuyback = (product: Product): number | null => {
    if (product.harga_buyback === null || product.harga_buyback === undefined) {
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

  return (
    <>
      <ProdukForm
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleSuccess}
        initialData={selectedProduct}
      />

      <GenerateQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSuccess={handleSuccess}
        produkId={selectedProduct?.id_produk || null}
        namaProduk={selectedProduct?.nama_produk || ""}
        gramasiProduk={selectedProduct?.gramasi_produk || ""}
        seriesProduk={selectedProduct?.series_produk || ""}
        // PERBAIKAN: Mengirimkan fineness ke modal
        fineness={selectedProduct?.fineness || ""}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Manajemen Produk</h1>
        <Button onClick={() => handleOpenFormModal(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
          <CardDescription>
            Berikut adalah daftar semua produk yang terdaftar di sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Cari berdasarkan Nama atau Series Produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {error && <p className="text-sm text-red-500 mb-4">Error: {error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Gambar</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Gramasi</TableHead>
                <TableHead>Fineness</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Harga Buyback</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id_produk}>
                    <TableCell>
                      <Image
                        src={
                          product.upload_gambar
                            ? `https://apiv2.silverium.id//${product.upload_gambar}`
                            : "https://via.placeholder.com/64"
                        }
                        alt={product.nama_produk}
                        width={64}
                        height={64}
                        className="h-16 w-16 object-cover rounded-md"
                        unoptimized={true}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.id_produk}
                    </TableCell>
                    <TableCell>{product.nama_produk}</TableCell>
                    <TableCell>{product.series_produk}</TableCell>
                    <TableCell>{product.gramasi_produk}</TableCell>
                    <TableCell>{product.fineness}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.harga_produk)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(calculateAdjustedBuyback(product))}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenFormModal(product)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenQrModal(product)}
                          >
                            Buat QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleDelete(product.id_produk)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Tidak ada produk yang ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Halaman {currentPage} dari {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage >= totalPages || isLoading}
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
