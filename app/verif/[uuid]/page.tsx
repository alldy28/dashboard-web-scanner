"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { parseISO, format } from "date-fns";
import { id } from "date-fns/locale";

// Impor semua ikon yang diperlukan dari @mui/icons-material
import VerifiedIcon from "@mui/icons-material/Verified";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
// Ikon untuk Theme Switcher
import Brightness4Icon from "@mui/icons-material/Brightness4"; // Moon icon for dark
import Brightness7Icon from "@mui/icons-material/Brightness7"; // Sun icon for light

const API_BASE_URL = "https://apiv2.silverium.id";

// --- CSS KEYFRAMES UNTUK ANIMASI (Diperbarui dengan loading dan transisi lambat) ---
const animationStyles = `
  /* Animasi Stempel yang diperlambat */
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
    /* Durasi diubah dari 0.8s menjadi 1.2s */
    animation: stamp-effect 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    opacity: 0;
  }

  /* Animasi baru untuk layar loading verifikasi */
  @keyframes pulse-glow {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 5px rgba(44, 187, 99, 0.4));
    }
    50% {
      transform: scale(1.1);
      filter: drop-shadow(0 0 15px rgba(44, 187, 99, 0.8));
    }
  }
  .animate-pulse-glow {
    animation: pulse-glow 2s infinite ease-in-out;
  }
`;

type ProductPreview = {
  nama_produk: string;
  upload_gambar: string | null;
  uuid_random: string;
  upload_audio: string | null;
  isOwned: boolean;
  nama_pemilik: string | null;
  gramasi_produk: string;
  fineness: string | null;
  is_blocked: boolean;
  blocked_at: string | null;
};

type VerificationResult = {
  productData: {
    nama_produk: string;
    gramasi_produk: string;
    series_produk: string;
    tahun_pembuatan: number;
    uuid_random: string;
    nama_pemilik: string | null;
    upload_gambar: string | null;
    fineness: string | null;
    tgl_produksi: string;
  };
  isOwned: boolean;
};

// --- KOMPONEN ANIMASI GAMBAR (Diperbarui untuk transparansi) ---
const AnimatedOriginalBadge = () => (
  <div className="absolute bottom-0 right-0 z-10 w-28 h-28 transform -rotate-12 translate-x-5 translate-y-5">
    <Image
      src="/100 original.png"
      alt="100% Original Badge"
      layout="fill"
      objectFit="contain"
      className="animate-stamp-effect opacity-60" // Mengubah opacity menjadi 60%
    />
  </div>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="text-center">
    <AutorenewIcon className="animate-spin text-4xl text-gray-800 dark:text-white mx-auto" />
    <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
  </div>
);

// --- KOMPONEN BARU UNTUK LAYAR VERIFIKASI ---
const VerifyingState = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 text-center">
    <div className="flex justify-center items-center mb-4 h-24">
      <VerifiedIcon
        sx={{ fontSize: "5rem" }}
        className="text-green-500 dark:text-green-400 animate-pulse-glow"
      />
    </div>
    <h1 className="text-xl font-bold text-gray-800 dark:text-white">
      Memverifikasi Keaslian...
    </h1>
    <p className="mt-2 text-gray-500 dark:text-gray-400">
      Sistem sedang memeriksa data produk Anda. Mohon tunggu sebentar.
    </p>
  </div>
);

const BlockedState = ({
  productPreview,
  uuid,
}: {
  productPreview: ProductPreview;
  uuid: string;
}) => {
  const ADMIN_WHATSAPP_NUMBER = "6281234567890";

  const handleContactAdmin = () => {
    const message = `Halo admin Silverium, saya ingin menanyakan status produk yang diblokir dengan ID unik:\n\n${uuid}`;
    const url = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "long",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-red-500 rounded-2xl shadow-lg p-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
        <WarningAmberIcon className="text-4xl text-red-500 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-red-500 dark:text-red-400">
        Produk Diblokir
      </h1>
      <Image
        src={
          productPreview.upload_gambar
            ? `${API_BASE_URL}/${productPreview.upload_gambar}`
            : `https://placehold.co/200x200/e2e8f0/2d3748?text=Produk`
        }
        alt="Gambar Produk"
        width={128}
        height={128}
        className="object-cover rounded-lg mx-auto my-4 border-2 border-gray-200 dark:border-gray-700"
      />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {productPreview.nama_produk}
      </h2>
      <p className="text-base text-gray-600 dark:text-gray-300 mt-1">
        {productPreview.gramasi_produk} | Kadar: {productPreview.fineness}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-2">
        ID: {uuid.substring(0, 6).toUpperCase()}
      </p>
      {productPreview.blocked_at && (
        <div className="mt-4 text-left bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tanggal Diblokir:
          </p>
          <p className="font-semibold text-red-500 dark:text-red-300">
            {formatDate(productPreview.blocked_at)}
          </p>
        </div>
      )}
      <p className="text-gray-600 dark:text-gray-300 my-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        Produk ini tidak dapat diverifikasi karena telah diblokir oleh sistem.
        Untuk informasi lebih lanjut, silakan hubungi admin kami.
      </p>
      <button
        onClick={handleContactAdmin}
        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg mt-2 hover:bg-green-600 transition-colors duration-300 flex items-center justify-center"
      >
        <WhatsAppIcon className="mr-2" />
        Hubungi Admin via WhatsApp
      </button>
    </div>
  );
};

const ResultState = ({ result }: { result: VerificationResult }) => {
  const { productData, isOwned } = result;

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
      <span className="font-semibold text-gray-900 dark:text-white text-right">
        {value || "-"}
      </span>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-[#a18032] dark:border-[#c7a44a] rounded-2xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 mb-4">
          <VerifiedIcon
            sx={{ fontSize: "3rem" }}
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
          Produk Verified
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Original 100% Authenticity
        </p>
      </div>

      <div className="relative flex justify-center items-center mb-6">
        <Image
          src={
            productData.upload_gambar
              ? `${API_BASE_URL}/${productData.upload_gambar}`
              : `https://placehold.co/200x200/e2e8f0/2d3748?text=Produk`
          }
          alt="Gambar Produk"
          width={160}
          height={160}
          className="object-cover rounded-lg mx-auto border-2 border-gray-200 dark:border-gray-700"
        />
        <AnimatedOriginalBadge />
      </div>

      <div className="space-y-3">
        <DetailRow
          label="Produk"
          value={`${productData.nama_produk} (${productData.gramasi_produk})`}
        />
        <DetailRow label="Series" value={productData.series_produk} />
        <DetailRow label="Kadar" value={productData.fineness} />
        <DetailRow
          label="Tahun Release Produk"
          value={productData.tahun_pembuatan}
        />
        <DetailRow
          label="Tanggal Produksi"
          value={formatApiDate(productData.tgl_produksi)}
        />
        <DetailRow
          label="ID Unik"
          value={productData.uuid_random.substring(0, 6).toUpperCase()}
        />
        <DetailRow
          label="Pemilik Terdaftar"
          value={
            productData.nama_pemilik ||
            (isOwned ? "Sudah Dimiliki" : "Belum Diklaim")
          }
        />
      </div>
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-lg font-bold text-[#a18032] dark:text-[#c7a44a]">
          Secured by Silverium
        </p>
      </div>
    </div>
  );
};

export default function VerificationPage() {
  const [view, setView] = useState<
    "loading" | "verification" | "verifying_product" | "result" | "error"
  >("loading");
  const [productPreview, setProductPreview] = useState<ProductPreview | null>(
    null
  );
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [validationCode, setValidationCode] = useState("");
  const [error, setError] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(true);

  const [theme, setTheme] = useState("dark");

  const params = useParams();
  const uuid = params.uuid as string;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ADMIN_WHATSAPP_NUMBER = "6281234567890";

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  const handleContactAdmin = useCallback(() => {
    const message = `Halo admin Silverium, saya ingin menanyakan status produk dengan ID unik:\n\n${uuid}`;
    const url = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  }, [uuid]);

  const requestLocation = useCallback(() => {
    setIsRequestingLocation(true);
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsRequestingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError(
            "Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser Anda untuk melanjutkan."
          );
          setIsRequestingLocation(false);
        }
      );
    } else {
      setLocationError("Geolocation tidak didukung oleh browser ini.");
      setIsRequestingLocation(false);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!uuid) {
      setError("ID Produk tidak valid.");
      setView("error");
      return;
    }

    const fetchPreview = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/preview/${uuid}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Produk tidak ditemukan.");
        }
        const data: ProductPreview = await response.json();
        setProductPreview(data);
        setView("verification");

        if (data.upload_audio) {
          const audioUrl = data.upload_audio.startsWith("http")
            ? data.upload_audio
            : `${API_BASE_URL}/${data.upload_audio}`;
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => setIsAudioPlaying(false);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setView("error");
      }
    };

    fetchPreview();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [uuid]);

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

  const handleVerify = async () => {
    if (!location) {
      alert("Izin lokasi diperlukan. Silakan aktifkan dan coba lagi.");
      requestLocation();
      return;
    }
    if (!validationCode) {
      setError("Kode validasi tidak boleh kosong.");
      return;
    }

    setError("");
    setView("verifying_product"); // <-- Tampilkan layar loading verifikasi

    try {
      // Simulasi delay agar loading terlihat (opsional, hapus di produksi)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const bodyPayload = {
        uuid,
        kode_validasi: validationCode,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const response = await fetch(`${API_BASE_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.reason || result.error || "Verifikasi gagal.");
      }
      setVerificationResult(result);
      setView("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setView("error");
    }
  };

  const renderContent = () => {
    if (isRequestingLocation) {
      return <LoadingState message="Meminta izin lokasi..." />;
    }

    if (locationError && !location) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-yellow-500 dark:border-yellow-700 rounded-2xl shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            Izin Lokasi Diperlukan
          </h2>
          <p className="text-gray-600 dark:text-gray-300 my-4">
            {locationError}
          </p>
          <button
            onClick={requestLocation}
            className="bg-yellow-500 text-white dark:text-gray-900 font-bold py-2 px-4 rounded-lg"
          >
            Aktifkan & Coba Lagi
          </button>
        </div>
      );
    }

    switch (view) {
      case "loading":
        return <LoadingState message="Memuat data produk..." />;
      case "verifying_product": // <-- Case baru untuk loading verifikasi
        return <VerifyingState />;
      case "verification":
        if (!productPreview) return null;
        if (productPreview.is_blocked) {
          return <BlockedState productPreview={productPreview} uuid={uuid} />;
        }
        return (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 text-center">
              <h1 className="text-2xl font-bold text-[#a18032] dark:text-[#c7a44a]">
                Verifikasi Keaslian
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Pastikan produk Anda asli.
              </p>
            </div>
            <div className="px-6 pb-6 text-center">
              <Image
                src={
                  productPreview.upload_gambar
                    ? `${API_BASE_URL}/${productPreview.upload_gambar}`
                    : `https://placehold.co/200x200/e2e8f0/2d3748?text=Produk`
                }
                alt="Gambar Produk"
                width={128}
                height={128}
                className="object-cover rounded-lg mx-auto mb-4 border-2 border-gray-200 dark:border-gray-700"
              />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {productPreview.nama_produk}
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-1">
                {productPreview.gramasi_produk} | Fineness:{" "}
                {productPreview.fineness}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-2">
                ID: {uuid.substring(0, 6).toUpperCase()}
              </p>
              <div className="mt-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 px-4 py-2 inline-block">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Status Kepemilikan
                </p>
                <p
                  className={`font-semibold ${
                    productPreview.isOwned
                      ? "text-yellow-500 dark:text-yellow-400"
                      : "text-green-500 dark:text-green-400"
                  }`}
                >
                  {productPreview.isOwned
                    ? `Dimiliki (${productPreview.nama_pemilik || "Pengguna"})`
                    : "Tersedia untuk Diklaim"}
                </p>
              </div>
              {productPreview.upload_audio && (
                <button
                  onClick={handlePlayAudio}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-[#a18032] hover:text-yellow-600 dark:text-[#c7a44a] dark:hover:text-yellow-300"
                >
                  {isAudioPlaying ? (
                    <PauseCircleOutlineIcon />
                  ) : (
                    <PlayCircleOutlineIcon />
                  )}
                  {isAudioPlaying ? "Hentikan Audio" : "Dengarkan Audio Produk"}
                </button>
              )}
            </div>
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 border-t border-b border-blue-200 dark:border-blue-800">
              <p className="text-center text-sm text-blue-800 dark:text-blue-300">
                Ini adalah tahap awal verifikasi. Untuk keaslian penuh akan
                dikonfirmasi setelah Anda memasukkan kode validasi.
              </p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4 text-center">
                  {error}
                </div>
              )}
              <label
                htmlFor="kode-validasi"
                className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
              >
                Masukkan Kode Validasi
              </label>
              <input
                type="text"
                id="kode-validasi"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="______"
              />
              <button
                onClick={handleVerify}
                className="w-full bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-[#c7a44a] dark:text-gray-900 dark:hover:bg-yellow-500 font-bold py-3 px-4 rounded-lg mt-6 transition-colors duration-300 flex items-center justify-center"
              >
                Cek Keaslian
              </button>
            </div>
          </div>
        );
      case "result":
        if (!verificationResult) return null;
        return <ResultState result={verificationResult} />;
      case "error":
        const isSuspiciousError =
          error.includes("Aktivitas Mencurigakan") ||
          error.includes("Produk ini diblokir");

        return (
          <div className="bg-white dark:bg-gray-800 border-2 border-red-500 rounded-2xl shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 mb-4">
              <WarningAmberIcon className="text-4xl text-red-500 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-red-500 dark:text-red-400">
              {isSuspiciousError ? "Verifikasi Gagal" : "Terjadi Kesalahan"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-4">{error}</p>

            {isSuspiciousError && (
              <button
                onClick={handleContactAdmin}
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg mt-6 hover:bg-green-600 transition-colors duration-300 flex items-center justify-center"
              >
                <WhatsAppIcon className="mr-2" />
                Hubungi Admin via WhatsApp
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center min-h-screen p-4 transition-colors duration-300">
      <style>{animationStyles}</style>
      <main className="w-full max-w-md mx-auto relative">
        <button
          onClick={toggleTheme}
          className="absolute top-2 right-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Brightness4Icon /> : <Brightness7Icon />}
        </button>
        {renderContent()}
      </main>
    </div>
  );
}
