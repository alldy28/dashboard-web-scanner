"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, Save, Loader2, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function KatalogPage() {
  const [pdfUrl, setPdfUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchUrl = useCallback(async () => {
    setIsFetching(true);
    try {
      const data = await apiClient("/api/admin/katalog");
      setPdfUrl(data.url_pdf || "");
    } catch (error) {
      console.error("Gagal mengambil URL katalog:", error);
      setResult({ type: "error", message: "Gagal memuat data URL saat ini." });
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchUrl();
  }, [fetchUrl]);

  const handleSave = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      await apiClient("/api/admin/katalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url_pdf: pdfUrl }),
      });
      setResult({
        type: "success",
        message: "URL katalog berhasil diperbarui!",
      });
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Manajemen Katalog Produk</h1>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>URL Katalog PDF</CardTitle>
          <CardDescription>
            Masukkan link URL lengkap ke file PDF katalog Anda. Link ini akan
            digunakan untuk halaman publik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="flex items-center justify-center h-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="pdf-url">Link PDF</Label>
              <div className="flex items-center gap-2">
                <Link className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="pdf-url"
                  type="url"
                  placeholder="https://contoh.com/path/ke/katalog.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isLoading || isFetching}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </CardFooter>
      </Card>
      {result && (
        <Alert
          className="mt-4 max-w-2xl"
          variant={result.type === "success" ? "default" : "destructive"}
        >
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>
            {result.type === "success" ? "Sukses" : "Error"}
          </AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
