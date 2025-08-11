"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, AlertCircle } from "lucide-react";

// --- Konfigurasi ---
const API_BASE_URL = "https://apiv2.silverium.id";

export default function KatalogPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKatalogUrl = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/katalog/public`);
        if (!res.ok) throw new Error("Gagal mengambil data katalog.");
        const data = await res.json();
        if (!data.url_pdf)
          throw new Error("URL katalog tidak tersedia saat ini.");
        setPdfUrl(data.url_pdf);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchKatalogUrl();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          Katalog Produk Silverium
        </h1>
        <p className="text-muted-foreground mt-2">
          Lihat katalog terbaru kami di bawah ini.
        </p>
      </div>

      <div className="w-full max-w-4xl aspect-[4/3] relative bg-white dark:bg-gray-900 rounded-lg shadow-lg">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Memuat katalog...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-lg">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="mt-4 font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0 rounded-lg"
            title="Katalog Silverium"
          />
        )}
      </div>

      {pdfUrl && (
        <div className="mt-6">
          <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
            <Button>
              <Download className="mr-2 h-4 w-4" /> Download Katalog
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
