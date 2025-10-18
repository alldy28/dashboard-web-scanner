// WAJIB: Jadikan halaman ini sebagai Client Component
// agar bisa menggunakan next/dynamic dengan ssr: false.
"use client";

import dynamic from "next/dynamic";

// SOLUSI: Impor MindArViewer secara dinamis dan nonaktifkan Server-Side Rendering (SSR).
// Ini akan memastikan A-Frame dan kodenya tidak pernah berjalan di server.
const MindArViewer = dynamic(() => import("@/components/MindArViewer"), {
  ssr: false, // Kunci utamanya ada di sini!
  loading: () => (
    // Tampilkan pesan loading yang bagus selagi komponen AR disiapkan
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
        color: "white",
        fontSize: "1.2rem",
      }}
    >
      Memuat AR Scanner...
    </div>
  ),
});

/**
 * Halaman ini didedikasikan untuk menampilkan viewer AR.
 */
export default function ARScannerPage() {
  // SOLUSI: Hapus tag <main> dan kembalikan komponen AR secara langsung
  // agar tidak ada styling default yang mengganggu.
  return <MindArViewer />;
}
