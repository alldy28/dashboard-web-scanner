"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DollarSign,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiClient } from "@/lib/api"; // PERBAIKAN: Impor apiClient

// PERBAIKAN: Variabel API_BASE_URL dihapus karena tidak lagi digunakan
// const API_BASE_URL = "http://localhost:3010";

export default function UpdateHargaPage() {
  const [currentSilverPrice, setCurrentSilverPrice] = useState<number | null>(
    null
  );
  // State untuk harga jual
  const [sellAdjustmentValue, setSellAdjustmentValue] = useState("");
  const [sellAdjustmentType, setSellAdjustmentType] = useState<
    "naik" | "turun" | "tetap"
  >("naik");

  // State untuk harga buyback
  const [buybackAdjustmentValue, setBuybackAdjustmentValue] = useState("");
  const [buybackAdjustmentType, setBuybackAdjustmentType] = useState<
    "naik" | "turun" | "tetap"
  >("naik");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(true);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fungsi untuk mengambil harga perak terkini dari API publik
  const fetchSilverPrice = async () => {
    setIsFetchingPrice(true);
    setResult(null);
    try {
      const response = await fetch(
        "https://data-asg.goldprice.org/dbXRates/IDR"
      );
      if (!response.ok)
        throw new Error("Gagal mengambil data harga perak eksternal.");

      const data = await response.json();
      const pricePerOunce = data.items[0].xagPrice;
      const pricePerGram = pricePerOunce / 31.1035;
      setCurrentSilverPrice(pricePerGram);
    } catch (error) {
      console.error("Gagal mengambil harga perak:", error);
      setResult({
        type: "error",
        message: "Gagal mengambil harga perak terkini dari sumber eksternal.",
      });
    } finally {
      setIsFetchingPrice(false);
    }
  };

  useEffect(() => {
    fetchSilverPrice();
  }, []);

  const handleUpdatePrices = async (priceType: "jual" | "buyback") => {
    setIsLoading(true);
    setResult(null);

    const isBuyback = priceType === "buyback";
    const value = isBuyback ? buybackAdjustmentValue : sellAdjustmentValue;
    const type = isBuyback ? buybackAdjustmentType : sellAdjustmentType;

    if (type !== "tetap" && !value) {
      setIsLoading(false);
      return;
    }

    try {
      // PERBAIKAN: Menggunakan apiClient yang sudah menangani otentikasi
      const data = await apiClient("/api/admin/produk/adjust-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: value || "0", // Kirim '0' jika input kosong untuk tipe 'tetap'
          adjustment_type: type,
          price_column: isBuyback ? "harga_buyback" : "harga_produk",
        }),
      });

      setResult({ type: "success", message: data.message });
    } catch (err) {
      setResult({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak diketahui.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Update Harga Produk</h1>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Harga Perak Terkini</CardTitle>
            <CardDescription>
              Harga referensi saat ini dari sumber eksternal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingPrice ? (
              <div className="flex items-center justify-center h-24">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : currentSilverPrice ? (
              <div className="flex items-center">
                <DollarSign className="h-10 w-10 text-slate-400 mr-4" />
                <div>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(currentSilverPrice)}
                  </p>
                  <p className="text-sm text-muted-foreground">per Gram</p>
                </div>
              </div>
            ) : (
              <p className="text-red-500">Gagal memuat harga.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={fetchSilverPrice}
              disabled={isFetchingPrice}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Harga
            </Button>
          </CardFooter>
        </Card>

        {/* --- KARTU HARGA JUAL --- */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Penyesuaian Harga Jual</CardTitle>
            <CardDescription>
              Sesuaikan harga jual semua produk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipe Penyesuaian</Label>
              <RadioGroup
                value={sellAdjustmentType}
                onValueChange={(value) =>
                  setSellAdjustmentType(value as "naik" | "turun" | "tetap")
                }
                className="flex items-center space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="naik" id="sell-naik" />
                  <Label
                    htmlFor="sell-naik"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4 text-green-500" /> Naik
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="turun" id="sell-turun" />
                  <Label
                    htmlFor="sell-turun"
                    className="flex items-center gap-2"
                  >
                    <TrendingDown className="h-4 w-4 text-red-500" /> Turun
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tetap" id="sell-tetap" />
                  <Label
                    htmlFor="sell-tetap"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4 text-blue-500" /> Harga Tetap
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sell-adjustment-value">
                {sellAdjustmentType === "tetap"
                  ? "Harga Baru per Gram (Opsional)"
                  : "Nilai Penyesuaian per Gram (Rp)"}
              </Label>
              <Input
                id="sell-adjustment-value"
                type="number"
                placeholder={
                  sellAdjustmentType === "tetap"
                    ? "Kosongkan untuk catat 'tanpa perubahan'"
                    : "Contoh: 5000"
                }
                value={sellAdjustmentValue}
                onChange={(e) => setSellAdjustmentValue(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleUpdatePrices("jual")}
              disabled={
                isLoading ||
                (sellAdjustmentType !== "tetap" && !sellAdjustmentValue)
              }
              className="w-full"
            >
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Update Harga Jual
            </Button>
          </CardFooter>
        </Card>

        {/* --- KARTU HARGA BUYBACK --- */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Penyesuaian Harga Buyback</CardTitle>
            <CardDescription>
              Sesuaikan harga buyback semua produk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipe Penyesuaian</Label>
              <RadioGroup
                value={buybackAdjustmentType}
                onValueChange={(value) =>
                  setBuybackAdjustmentType(value as "naik" | "turun" | "tetap")
                }
                className="flex items-center space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="naik" id="buyback-naik" />
                  <Label
                    htmlFor="buyback-naik"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4 text-green-500" /> Naik
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="turun" id="buyback-turun" />
                  <Label
                    htmlFor="buyback-turun"
                    className="flex items-center gap-2"
                  >
                    <TrendingDown className="h-4 w-4 text-red-500" /> Turun
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tetap" id="buyback-tetap" />
                  <Label
                    htmlFor="buyback-tetap"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4 text-blue-500" /> Harga Tetap
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyback-adjustment-value">
                {buybackAdjustmentType === "tetap"
                  ? "Harga Baru per Gram (Opsional)"
                  : "Nilai Penyesuaian per Gram (Rp)"}
              </Label>
              <Input
                id="buyback-adjustment-value"
                type="number"
                placeholder={
                  buybackAdjustmentType === "tetap"
                    ? "Kosongkan untuk catat 'tanpa perubahan'"
                    : "Contoh: 5000"
                }
                value={buybackAdjustmentValue}
                onChange={(e) => setBuybackAdjustmentValue(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleUpdatePrices("buyback")}
              disabled={
                isLoading ||
                (buybackAdjustmentType !== "tetap" && !buybackAdjustmentValue)
              }
              className="w-full"
            >
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Update Harga Buyback
            </Button>
          </CardFooter>
        </Card>
      </div>
      {result && (
        <Alert
          variant={result.type === "error" ? "destructive" : "default"}
          className="mt-6"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {result.type === "success" ? "Sukses" : "Error"}
          </AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
