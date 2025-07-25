"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

// Tipe data untuk produk yang lengkap
type Product = {
  id_produk: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  fineness: string;
  harga_produk: string;
  tahun_pembuatan: number;
  upload_gambar?: string | null;
};

interface ProdukClientProps {
  initialProducts: Product[];
}

export function ProdukClient({ initialProducts }: ProdukClientProps) {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const router = useRouter();

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
    router.refresh();
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?"))
      return;

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        throw new Error("Sesi admin tidak valid. Silakan login kembali.");
      }

      const response = await fetch(
        `https://zh8r77hb-3000.asse.devtunnels.ms/api/produk/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus produk");
      }
      alert("Produk berhasil dihapus!");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Terjadi kesalahan yang tidak diketahui.");
      }
    }
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
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialProducts.map((product) => (
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
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(parseFloat(product.harga_produk))}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
