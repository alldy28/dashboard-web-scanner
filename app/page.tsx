"use client"; // Kita butuh interaktivitas, jadi ini adalah Client Component

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  // State untuk form input
  const [nomorTelepon, setNomorTelepon] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handler untuk proses login
  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://apiv2.silverium.id/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nomor_telepon: nomorTelepon,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login gagal.");
      }

      // PERBAIKAN: Simpan accessToken dan refreshToken
      if (data.accessToken && data.refreshToken) {
        // Menggunakan nama yang lebih spesifik untuk token admin
        localStorage.setItem("admin_access_token", data.accessToken);
        localStorage.setItem("admin_refresh_token", data.refreshToken);
        router.push("/dashboard"); // Arahkan ke dashboard
      } else {
        throw new Error("Token tidak diterima dari server.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan tidak diketahui."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login Admin</CardTitle>
          <CardDescription>
            Silakan masuk untuk melanjutkan ke dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
            <Input
              id="nomor_telepon"
              type="text"
              placeholder="Masukkan nomor telepon admin"
              required
              value={nomorTelepon}
              onChange={(e) => setNomorTelepon(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
