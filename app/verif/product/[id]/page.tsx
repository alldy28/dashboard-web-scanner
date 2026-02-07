"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

// Impor ikon Material UI
import VerifiedIcon from "@mui/icons-material/Verified";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

// Konfigurasi API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://apiv2.silverium.id";

// --- CSS Animasi ---
const animationStyles = `
  @keyframes stamp-effect {
    0% {
      opacity: 0;
      transform: scale(1.5) rotate(-30deg) translateY(-50px);
      filter: brightness(0.5) blur(5px);
    }
    50% {
      opacity: 1;
      transform: scale(0.9) rotate(5deg) translateY(0);
      filter: brightness(1) blur(0);
    }
    75% {
      transform: scale(1.05) rotate(-2deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
      filter: brightness(1) blur(0);
    }
  }
  .animate-stamp-effect {
    animation: stamp-effect 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    opacity: 0;
  }
`;

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

// --- Komponen Baris Detail ---
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
    <span className="font-semibold text-gray-900 dark:text-white text-right">
      {value || "-"}
    </span>
  </div>
);

// --- Komponen Stempel Original ---
const AnimatedOriginalBadge = () => (
  <div className="absolute bottom-0 right-0 z-10 w-28 h-28 transform -rotate-12 translate-x-5 translate-y-5">
    <Image
      src="/100 original.png"
      alt="100% Original Badge"
      layout="fill"
      objectFit="contain"
      className="animate-stamp-effect opacity-60"
    />
  </div>
);

export default function GenericProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const { id } = params;

  // State untuk Audio
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State Tema (Default: Dark)
  const [theme, setTheme] = useState("dark");

  // Efek 1: Inisialisasi Tema saat Mount
  useEffect(() => {
    // Cek localStorage atau preferensi sistem
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme && ["dark", "light"].includes(savedTheme)) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme("dark");
    } else {
      setTheme("light"); // Default fallback
    }
  }, []);

  // Efek 2: Terapkan class ke <html> saat tema berubah
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Efek Fetch Produk
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

        // Inisialisasi Audio jika ada
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

    // Cleanup Audio saat komponen unmount
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

  // Tampilan Loading
  if (isLoading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen p-4 transition-colors duration-300">
        <div className="text-center">
          <AutorenewIcon className="animate-spin text-4xl text-gray-800 dark:text-white mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Memuat detail produk...
          </p>
        </div>
      </div>
    );
  }

  // Tampilan Error
  if (error) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen p-4 transition-colors duration-300">
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  // Tampilan Utama
  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen p-4 transition-colors duration-300">
      <style>{animationStyles}</style>
      <main className="w-full max-w-md mx-auto relative">
        {product && (
          <div className="bg-white dark:bg-gray-800 border-2 border-[#a18032] dark:border-[#c7a44a] rounded-2xl shadow-lg p-6 relative transition-colors duration-300">
            {/* Tombol Toggle Tema */}
            <button
              onClick={toggleTheme}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-20 shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </button>

            <div className="text-center mb-6 pt-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 mb-4 transition-colors duration-300">
                <VerifiedIcon
                  sx={{ fontSize: "3rem" }}
                  className="text-green-600 dark:text-green-400"
                />
              </div>

              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
                Detail Produk
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Informasi Produk Otentik Silverium
              </p>
            </div>

            <div className="relative flex justify-center items-center mb-6">
              <Image
                src={
                  product.upload_gambar
                    ? `${API_BASE_URL}/${product.upload_gambar}`
                    : `https://placehold.co/200x200/e2e8f0/2d3748?text=Produk`
                }
                alt={product.nama_produk}
                width={160}
                height={160}
                className="object-cover rounded-lg mx-auto border-2 border-gray-200 dark:border-gray-700 transition-colors duration-300"
              />
              <AnimatedOriginalBadge />
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

            {/* Tombol Audio */}
            {product.upload_audio && (
              <div className="text-center mt-6">
                <button
                  onClick={handlePlayAudio}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#a18032] dark:border-[#c7a44a] text-sm font-medium text-[#a18032] dark:text-[#c7a44a] hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  {isAudioPlaying ? (
                    <PauseCircleOutlineIcon />
                  ) : (
                    <PlayCircleOutlineIcon />
                  )}
                  <span>
                    {isAudioPlaying ? "Hentikan Audio" : "Dengarkan Penjelasan"}
                  </span>
                </button>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center transition-colors duration-300">
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
