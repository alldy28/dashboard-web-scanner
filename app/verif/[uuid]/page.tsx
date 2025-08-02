"use client"; // Diperlukan karena kita menggunakan hooks (useState, useEffect)

import React, { useState, useEffect, useRef } from "react"; // useRef ditambahkan
import Image from "next/image";
import { useParams } from "next/navigation";

// --- Konfigurasi ---
const API_BASE_URL = "https://apiv2.silverium.id"; // Sesuaikan jika API Anda berjalan di port lain

// --- Tipe Data ---
type ProductPreview = {
  nama_produk: string;
  upload_gambar: string | null;
  uuid_random: string;
  upload_audio: string | null; // PENAMBAHAN: Tipe untuk audio
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

// --- Komponen Anak ---

const LoadingState = ({ message }: { message: string }) => (
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
    <p className="mt-4 text-gray-400">{message}</p>
  </div>
);

const ResultState = ({ result }: { result: VerificationResult }) => {
  const { productData, isOwned } = result;

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | null;
  }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-700">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-semibold text-white text-right">
        {value || "-"}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-800 border-2 border-[#c7a44a] rounded-2xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <svg
            className="w-10 h-10 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-400">
          Produk Terverifikasi Asli
        </h1>
        <p className="text-gray-400">Certificate of Original Authenticity</p>
      </div>

      <div className="text-center mb-6">
        <Image
          src={
            productData.upload_gambar
              ? `${API_BASE_URL}/${productData.upload_gambar}`
              : `https://placehold.co/200x200/2d3748/e2e8f0?text=Produk`
          }
          alt="Gambar Produk"
          width={160}
          height={160}
          className="object-cover rounded-lg mx-auto mb-4 border-2 border-gray-700"
        />
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
          value={new Date(productData.tgl_produksi).toLocaleString("id-ID")}
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

      <div className="mt-8 pt-4 border-t border-gray-700 text-center">
        <p className="text-lg font-bold text-[#c7a44a]">Secured by Silverium</p>
      </div>
    </div>
  );
};

// --- Komponen Utama Halaman ---
export default function VerificationPage() {
  const [view, setView] = useState<
    "loading" | "verification" | "result" | "error"
  >("loading");
  const [productPreview, setProductPreview] = useState<ProductPreview | null>(
    null
  );
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [validationCode, setValidationCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const params = useParams();
  const uuid = params.uuid as string;
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          throw new Error("Produk tidak ditemukan.");
        }
        const data: ProductPreview = await response.json();
        setProductPreview(data);
        setView("verification");

        // PERBAIKAN: Siapkan audio, tapi jangan langsung diputar
        if (data.upload_audio) {
          const audioUrl = data.upload_audio.startsWith("http")
            ? data.upload_audio
            : `${API_BASE_URL}/${data.upload_audio}`;

          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => setIsAudioPlaying(false); // Reset state saat audio selesai
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Terjadi kesalahan yang tidak diketahui.");
        }
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
    if (!validationCode) {
      setError("Kode validasi tidak boleh kosong.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, kode_validasi: validationCode }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Verifikasi gagal.");
      }

      setVerificationResult(result);
      setView("result");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case "loading":
        return <LoadingState message="Memuat data produk..." />;
      case "verification":
        if (!productPreview) return null;
        return (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 text-center">
              <h1 className="text-2xl font-bold text-[#c7a44a]">
                Verifikasi Keaslian
              </h1>
              <p className="text-gray-400 mt-1">Pastikan produk Anda asli.</p>
            </div>
            <div className="px-6 pb-6 text-center">
              <Image
                src={
                  productPreview.upload_gambar
                    ? `${API_BASE_URL}/${productPreview.upload_gambar}`
                    : `https://placehold.co/200x200/2d3748/e2e8f0?text=Produk`
                }
                alt="Gambar Produk"
                width={128}
                height={128}
                className="object-cover rounded-lg mx-auto mb-4 border-2 border-gray-700"
              />
              <h2 className="text-xl font-semibold text-white">
                {productPreview.nama_produk}
              </h2>
              <p className="text-sm text-gray-400 font-mono mt-2">
                ID: {uuid.substring(0, 6).toUpperCase()}
              </p>
              {/* PENAMBAHAN: Tombol untuk memutar audio */}
              {productPreview.upload_audio && (
                <button
                  onClick={handlePlayAudio}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-[#c7a44a] hover:text-yellow-300"
                >
                  {isAudioPlaying ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75H16.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Hentikan Audio
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Dengarkan Audio Produk
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="p-6 bg-gray-900">
              {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-center">
                  {error}
                </div>
              )}
              <label
                htmlFor="kode-validasi"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Masukkan Kode Validasi
              </label>
              <input
                type="text"
                id="kode-validasi"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="______"
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full bg-[#c7a44a] text-gray-900 font-bold py-3 px-4 rounded-lg mt-6 hover:bg-yellow-500 transition-colors duration-300 flex items-center justify-center disabled:opacity-50"
              >
                {isVerifying ? "Memverifikasi..." : "Cek Keaslian"}
                {isVerifying && (
                  <svg
                    className="animate-spin h-5 w-5 text-gray-900 ml-3"
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
                )}
              </button>
            </div>
          </div>
        );
      case "result":
        if (!verificationResult) return null;
        return <ResultState result={verificationResult} />;
      case "error":
        return <p className="text-red-400 text-center">{error}</p>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 text-white flex items-center justify-center min-h-screen p-4">
      <main className="w-full max-w-md mx-auto">{renderContent()}</main>
    </div>
  );
}
