// app/ar-scanner/page.tsx

"use client"; // <-- TAMBAHKAN BARIS INI DI PALING ATAS

import React from "react";
import dynamic from "next/dynamic";

// 1. Buat komponen "Loading" sederhana
const ArLoadingComponent = () => {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        color: "white",
        fontFamily: "sans-serif",
        fontSize: "1.2rem",
      }}
    >
      Memuat AR Scanner...
    </div>
  );
};

// 2. Impor MindArViewer secara dinamis
// Sekarang ini diizinkan karena kita ada di dalam "use client"
const MindArViewer = dynamic(
  () => import("../../components/MindArViewer"), // Path ke komponen Anda
  {
    ssr: false, // PENTING: Jangan pernah render ini di server
    loading: () => <ArLoadingComponent />, // Tampilkan ini saat loading
  }
);

/**
 * Halaman ini adalah "host" atau "wadah" untuk
 * komponen MindArViewer Anda.
 */
export default function ArScannerPage() {
  // Merender komponen yang sudah di-load secara dinamis.
  return (
    <main>
      <MindArViewer />
    </main>
  );
}
