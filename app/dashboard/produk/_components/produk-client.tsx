"use client";

import { useState, useEffect } from "react";
// PERBAIKAN: useRouter tidak lagi diimpor karena tidak digunakan
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
import { ProdukForm } from "./produk-form";
import { GenerateQrModal } from "./generate-qr-modal";

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

// Komponen ini sekarang tidak lagi menerima initialProducts,
// karena data akan diambil di sisi klien.
export function ProdukClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // PERBAIKAN: Variabel router dihapus karena tidak digunakan
  // const router = useRouter();

  // Fungsi untuk mengambil data berdasarkan halaman
  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://zh8r77hb-3000.asse.devtunnels.ms/api/produk?page=${page}`,
        {
          cache: "no-store",
        }
      );
      if (!res.ok) {
        throw new Error("Gagal mengambil data produk dari server");
      }
      const result: PaginatedProductsResponse = await res.json();
      setProducts(result.data);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ambil data saat komponen pertama kali dimuat dan saat halaman berubah
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

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
    fetchData(currentPage); // Refresh data di halaman saat ini
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?"))
      return;

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        throw new Error("Sesi admin tidak valid.");
      }

      const response = await fetch(
        `https://zh8r77hb-3000.asse.devtunnels.ms/api/produk/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus produk");
      }
      alert("Produk berhasil dihapus!");
      fetchData(currentPage); // Refresh data
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    }
  };

  const formatCurrency = (value: string | null | undefined) => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
      return "-";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
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
              ) : (
                products.map((product) => (
                  <TableRow key={product.id_produk}>
                    <TableCell>
                      <Image
                        src={
                          product.upload_gambar
                            ? `https://zh8r77hb-3000.asse.devtunnels.ms/${product.upload_gambar}`
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
                      {formatCurrency(product.harga_buyback)}
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
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
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
