"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function BandarVerificationPage() {
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Sedang memverifikasi akun Anda...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan di URL.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/verify-email/${token}`
        );

        if (!res.ok) {
          let errorMsg = "Token verifikasi tidak valid atau sudah kedaluwarsa.";
          try {
            const errorHtml = await res.text();
            const match = errorHtml.match(/<h1>(.*?)<\/h1>/);
            if (match && match[1]) {
              errorMsg = match[1];
            }
          } catch {
            // <-- PERBAIKAN 1: Hapus variabel '_' yang tidak digunakan
            // Biarkan pesan error default jika gagal parsing, tidak perlu melakukan apa-apa di sini
          }
          throw new Error(errorMsg);
        }

        setStatus("success");
        setMessage(
          "Verifikasi berhasil! Akun bandar Anda sekarang sudah aktif."
        );
      } catch (err) {
        // <-- PERBAIKAN 2: Hapus ': any'
        // Gunakan penanganan error yang aman
        if (err instanceof Error) {
          setMessage(err.message);
        } else {
          setMessage("Terjadi kesalahan saat verifikasi.");
        }
        setStatus("error");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">
              {message}
            </h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">
              Verifikasi Berhasil!
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link href="/bandar-login">
              <button className="mt-6 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
                Lanjut ke Halaman Login
              </button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">
              Verifikasi Gagal
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <Link href="/bandar-login">
              <button className="mt-6 rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80">
                Kembali ke Halaman Login
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
