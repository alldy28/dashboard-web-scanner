"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";

interface UploadProofProps {
  transactionId: number;
  existingProofUrl: string | null;
}

export default function UploadProof({
  transactionId,
  existingProofUrl,
}: UploadProofProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Silakan pilih file terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("admin_access_token");
    const formData = new FormData();
    formData.append("proofImage", file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${transactionId}/upload-proof`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Gagal mengunggah bukti.");
      }

      alert("Bukti berhasil diunggah!");
      router.refresh();
    } catch (err){
        if(err instanceof Error) {
            setError(err.message);
        }else {
            setError('terjadi error tidak dikatehui')
        }
      } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {existingProofUrl && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Bukti Saat Ini:
          </p>
          <div className="relative h-48 w-48 rounded-lg border">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/${existingProofUrl}`}
              alt="Bukti Pengiriman"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
        />
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {existingProofUrl ? "Ganti Bukti" : "Unggah Bukti"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
