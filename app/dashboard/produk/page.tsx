// app/dashboard/produk/page.tsx

import { ProdukClient } from "./_components/produk-client";

// Tidak perlu lagi mengambil data di sini, karena ProdukClient akan menanganinya
export default function ProdukPage() {
  // Cukup render komponen client, ia akan mengambil datanya sendiri
  return <ProdukClient />;
}
