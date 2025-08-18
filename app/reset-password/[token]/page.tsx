"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    if (!password) {
      setError("Password tidak boleh kosong.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `https://apiv2.silverium.id/api/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mereset password.");
      }
      setMessage(data.message);
      // Arahkan ke login setelah 3 detik
      setTimeout(() => router.push("/"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Masukkan password baru Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {message ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Sukses!</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="password">Password Baru</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">
                  Konfirmasi Password Baru
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? "Menyimpan..." : "Reset Password"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
