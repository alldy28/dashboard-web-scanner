"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

// --- Konfigurasi ---
const API_BASE_URL = "http://localhost:3010";

// --- Tipe Data ---
type Product = {
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  fineness: string | null;
  tahun_pembuatan: number;
  upload_gambar: string | null;
  upload_audio: string | null;
};

// --- Komponen ---
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-700">
    <span className="text-gray-400 text-sm">{label}</span>
    <span className="font-semibold text-white text-right">{value || "-"}</span>
  </div>
);

export default function GenericProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const { id } = params;

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/product/public/${id}`);
        if (!res.ok) {
          throw new Error("Produk tidak ditemukan atau terjadi kesalahan.");
        }
        const data: Product = await res.json();
        setProduct(data);

        if (data.upload_audio) {
          const audioUrl = data.upload_audio.startsWith("http")
            ? data.upload_audio
            : `${API_BASE_URL}/${data.upload_audio}`;
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => setIsAudioPlaying(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [id]);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current
          .play()
          .catch((err) => console.error("Gagal memutar audio:", err));
        setIsAudioPlaying(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-white mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-400">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen p-4">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen p-4">
      <main className="w-full max-w-md mx-auto">
        {product && (
          <div className="bg-gray-800 border-2 border-[#c7a44a] rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-green-400">
                Detail Produk
              </h1>
              <p className="text-gray-400">Informasi Produk Silverium</p>
            </div>
            <div className="text-center mb-6">
              <Image
                src={
                  product.upload_gambar
                    ? `${API_BASE_URL}/${product.upload_gambar}`
                    : `https://placehold.co/200x200/2d3748/e2e8f0?text=Produk`
                }
                alt={product.nama_produk}
                width={160}
                height={160}
                className="object-cover rounded-lg mx-auto mb-4 border-2 border-gray-700"
              />
            </div>
            <div className="space-y-3">
              <DetailRow
                label="Produk"
                value={`${product.nama_produk} (${product.gramasi_produk})`}
              />
              <DetailRow label="Series" value={product.series_produk} />
              <DetailRow label="Kadar" value={product.fineness} />
              <DetailRow label="Tahun" value={product.tahun_pembuatan} />
            </div>
            {product.upload_audio && (
              <div className="text-center mt-6">
                <button
                  onClick={handlePlayAudio}
                  className="inline-flex items-center gap-2 text-sm text-[#c7a44a] hover:text-yellow-300"
                >
                  {isAudioPlaying ? "Hentikan Audio" : "Dengarkan Audio Produk"}
                </button>
              </div>
            )}
            <div className="mt-8 pt-4 border-t border-gray-700 text-center">
              <p className="text-lg font-bold text-[#c7a44a]">
                Secured by Silverium
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
