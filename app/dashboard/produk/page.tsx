// app/dashboard/produk/page.tsx

import { ProdukClient } from "./_components/produk-client";

// PERBAIKAN: Tipe data Product disesuaikan agar cocok dengan komponen client
type Product = {
  id_produk: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  fineness: string; // Ditambahkan agar konsisten
  harga_produk: string;
  tahun_pembuatan: number;
  upload_gambar?: string | null; // Ditambahkan agar konsisten
};

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch("https://zh8r77hb-3000.asse.devtunnels.ms/api/produk", {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Gagal mengambil data produk dari server");
    }
    return res.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unknown error occurred:", error);
    }
    return []; // Kembalikan array kosong jika terjadi error
  }
}

export default async function ProdukPage() {
  const products = await getProducts();
  return <ProdukClient initialProducts={products} />;
}
