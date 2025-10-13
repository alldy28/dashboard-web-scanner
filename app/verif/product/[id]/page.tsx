"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { parseISO, format } from "date-fns";
import { id } from "date-fns/locale";

// --- Ikon Tambahan ---
import Brightness4Icon from "@mui/icons-material/Brightness4"; // Ikon bulan
import Brightness7Icon from "@mui/icons-material/Brightness7"; // Ikon matahari
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";


// --- Konfigurasi ---
const API_BASE_URL = "https://apiv2.silverium.id";

// --- Tipe Data ---
type Product = {
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  fineness: string | null;
  tahun_pembuatan: number;
  tgl_produksi: string;
  upload_gambar: string | null;
  upload_audio: string | null;
};

// --- Komponen ---
// Komponen DetailRow diperbarui untuk mendukung dark mode secara internal

const formatApiDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      return format(date, "d MMMM yyyy, HH:mm", { locale: id });
    } catch (error) {
      console.error("Invalid date format for:", dateString, error);
      return "Tanggal tidak valid";
    }
  };


const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
    <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
    <span className="font-semibold text-gray-900 dark:text-white text-right">{value || "-"}</span>
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

  // State dan effect untuk manajemen tema
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme && ["dark", "light"].includes(savedTheme)) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

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
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-gray-600 dark:text-white mx-auto"
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
          <p className="mt-4 text-gray-500 dark:text-gray-400">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen p-4">
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen p-4 transition-colors duration-300">
      <main className="w-full max-w-md mx-auto relative">
        <button
          onClick={toggleTheme}
          className="absolute -top-12 right-0 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </button>

        {product && (
          <div className="bg-white dark:bg-gray-800 border-2 border-[#a18032] dark:border-[#c7a44a] rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
                Detail Produk
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Informasi Produk Silverium
              </p>
            </div>
            <div className="text-center mb-6">
              <Image
                src={
                  product.upload_gambar
                    ? `${API_BASE_URL}/${product.upload_gambar}`
                    : `https://placehold.co/200x200/e2e8f0/2d3748?text=Produk`
                }
                alt={product.nama_produk}
                width={160}
                height={160}
                className="object-cover rounded-lg mx-auto mb-4 border-2 border-gray-200 dark:border-gray-700"
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
              <DetailRow
                label="Tanggal Produksi"
                value={formatApiDate(product.tgl_produksi)}
              />
            </div>
            {product.upload_audio && (
              <div className="text-center mt-6">
                <button
                  onClick={handlePlayAudio}
                  className="inline-flex items-center gap-2 text-sm text-[#a18032] dark:text-[#c7a44a] hover:text-yellow-600 dark:hover:text-yellow-300"
                >
                  {isAudioPlaying ? (
                    <PauseCircleOutlineIcon />
                  ) : (
                    <PlayCircleOutlineIcon />
                  )}
                  {isAudioPlaying ? "Hentikan Audio" : "Dengarkan Audio Produk"}
                </button>
              </div>
            )}
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-lg font-bold text-[#a18032] dark:text-[#c7a44a]">
                Secured by Silverium
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}