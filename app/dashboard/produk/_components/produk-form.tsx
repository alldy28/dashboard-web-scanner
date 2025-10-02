"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// --- Tipe Data ---
type Product = {
  id_produk?: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  fineness: string;
  harga_produk: string;
  harga_buyback?: string | null;
  tahun_pembuatan: number;
  upload_gambar?: string | null;
  upload_audio?: string | null;
};

// --- Props Komponen ---
interface ProdukFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Product | null;
}

const seriesOptions = [
  "Gift Series",
  "Silver Bullion",
  "Edisi Khusus",
  "Silver Reguler",
  "Silver Custom",
];

export default function ProdukForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProdukFormProps) {
  // State
  const [formData, setFormData] = useState({
    nama_produk: "",
    series_produk: "",
    gramasi_produk: "",
    fineness: "",
    harga_produk: "",
    harga_buyback: "",
    tahun_pembuatan: new Date().getFullYear(),
  });

  const [imageOption, setImageOption] = useState("upload");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedExistingImage, setSelectedExistingImage] = useState("");
  const [selectedNewImageFile, setSelectedNewImageFile] = useState<File | null>(
    null
  );

  const [audioOption, setAudioOption] = useState("none");
  const [existingAudios, setExistingAudios] = useState<string[]>([]);
  const [selectedExistingAudio, setSelectedExistingAudio] = useState("");
  const [selectedNewAudioFile, setSelectedNewAudioFile] = useState<File | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!initialData;

  // Efek untuk mengisi form saat data awal berubah
  useEffect(() => {
    if (initialData) {
      setFormData({
        nama_produk: initialData.nama_produk || "",
        series_produk: initialData.series_produk || "",
        gramasi_produk: initialData.gramasi_produk || "",
        fineness: initialData.fineness || "",
        harga_produk: String(initialData.harga_produk || ""),
        harga_buyback: String(initialData.harga_buyback || ""),
        tahun_pembuatan:
          initialData.tahun_pembuatan || new Date().getFullYear(),
      });
      if (initialData.upload_gambar) {
        setImageOption("select");
        setSelectedExistingImage(initialData.upload_gambar);
      }
      if (initialData.upload_audio) {
        setAudioOption("select");
        setSelectedExistingAudio(initialData.upload_audio);
      }
    } else {
      // Reset form jika tidak ada data awal (mode tambah baru)
      setFormData({
        nama_produk: "",
        series_produk: "",
        gramasi_produk: "",
        fineness: "",
        harga_produk: "",
        harga_buyback: "",
        tahun_pembuatan: new Date().getFullYear(),
      });
      setImageOption("upload");
      setAudioOption("none");
    }
  }, [initialData, isOpen]);

  // Efek untuk mengambil daftar file yang sudah ada dari server
  useEffect(() => {
    if (isOpen) {
      const fetchFiles = async () => {
        try {
          const token = localStorage.getItem("admin_access_token");
          const headers = { Authorization: `Bearer ${token}` };

          const [audioRes, imageRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/audio-files`, {
              headers,
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/image-files`, {
              headers,
            }),
          ]);

          if (!audioRes.ok || !imageRes.ok)
            throw new Error("Gagal mengambil daftar file");

          const audioData = await audioRes.json();
          const imageData = await imageRes.json();

          setExistingAudios(audioData);
          setExistingImages(imageData);
        } catch (err) {
          console.error("Gagal mengambil daftar file:", err);
        }
      };
      fetchFiles();
    }
  }, [isOpen]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value));
    });

    if (imageOption === "upload" && selectedNewImageFile) {
      data.append("gambar", selectedNewImageFile);
    } else if (imageOption === "select" && selectedExistingImage) {
      data.append("existing_image_path", selectedExistingImage);
    }

    if (audioOption === "select" && selectedExistingAudio) {
      data.append("existing_audio_path", selectedExistingAudio);
    } else if (audioOption === "upload" && selectedNewAudioFile) {
      data.append("audio", selectedNewAudioFile);
    } else if (audioOption === "none") {
      data.append("existing_audio_path", "");
    }

    const endpoint = isEditMode
      ? `/api/admin/produk/${initialData?.id_produk}`
      : `/api/admin/produk`;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("admin_access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const responseData = await res.json();
      if (!res.ok)
        throw new Error(responseData.error || "Terjadi kesalahan server");

      toast.success(
        `Produk berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}!`
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
          <DialogDescription>Lengkapi detail di bawah ini.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nama_produk" className="text-right">
                Nama
              </Label>
              <Input
                id="nama_produk"
                name="nama_produk"
                value={formData.nama_produk}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="series_produk" className="text-right">
                Series
              </Label>
              <Select
                onValueChange={(value) =>
                  setFormData((p) => ({ ...p, series_produk: value }))
                }
                value={formData.series_produk}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih series..." />
                </SelectTrigger>
                <SelectContent>
                  {seriesOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gramasi_produk" className="text-right">
                Gramasi
              </Label>
              <Input
                id="gramasi_produk"
                name="gramasi_produk"
                value={formData.gramasi_produk}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fineness" className="text-right">
                Fineness
              </Label>
              <Input
                id="fineness"
                name="fineness"
                value={formData.fineness}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="harga_produk" className="text-right">
                Harga Jual
              </Label>
              <Input
                id="harga_produk"
                name="harga_produk"
                type="number"
                value={formData.harga_produk}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="harga_buyback" className="text-right">
                Harga Buyback
              </Label>
              <Input
                id="harga_buyback"
                name="harga_buyback"
                type="number"
                value={formData.harga_buyback}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tahun_pembuatan" className="text-right">
                Tahun
              </Label>
              <Input
                id="tahun_pembuatan"
                name="tahun_pembuatan"
                type="number"
                value={formData.tahun_pembuatan}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Gambar</Label>
              <RadioGroup
                value={imageOption}
                onValueChange={setImageOption}
                className="col-span-3 flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="img-upload" />
                  <Label htmlFor="img-upload">Upload Baru</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="select" id="img-select" />
                  <Label htmlFor="img-select">Pilih yang Ada</Label>
                </div>
              </RadioGroup>
            </div>
            {imageOption === "upload" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div />
                <Input
                  id="gambar"
                  name="gambar"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedNewImageFile(
                      e.target.files ? e.target.files[0] : null
                    )
                  }
                  className="col-span-3"
                />
              </div>
            )}
            {imageOption === "select" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div />
                  <Select
                    onValueChange={setSelectedExistingImage}
                    value={selectedExistingImage}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih file gambar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        // PERBAIKAN: Saring nilai kosong sebelum map
                        existingImages
                          .filter((p) => p)
                          .map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.replace("uploads/images/", "")}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                {selectedExistingImage && (
                  <div className="grid grid-cols-4 items-center gap-4 mt-2">
                    <div />
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">
                        Pratinjau
                      </Label>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/${selectedExistingImage}`}
                        alt="Pratinjau"
                        width={80}
                        height={80}
                        className="h-20 w-20 object-cover mt-1 rounded-md"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Audio</Label>
              <RadioGroup
                value={audioOption}
                onValueChange={setAudioOption}
                className="col-span-3 flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="audio-none" />
                  <Label htmlFor="audio-none">Tidak Ada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="audio-upload" />
                  <Label htmlFor="audio-upload">Upload Baru</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="select" id="audio-select" />
                  <Label htmlFor="audio-select">Pilih yang Ada</Label>
                </div>
              </RadioGroup>
            </div>
            {audioOption === "upload" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div />
                <Input
                  id="audio"
                  name="audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    setSelectedNewAudioFile(
                      e.target.files ? e.target.files[0] : null
                    )
                  }
                  className="col-span-3"
                />
              </div>
            )}
            {audioOption === "select" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div />
                  <Select
                    onValueChange={setSelectedExistingAudio}
                    value={selectedExistingAudio}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih file audio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        // PERBAIKAN: Saring nilai kosong sebelum map
                        existingAudios
                          .filter((p) => p)
                          .map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.replace("uploads/audio/", "")}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                {selectedExistingAudio && (
                  <div className="grid grid-cols-4 items-center gap-4 mt-2">
                    <div />
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">
                        Pratinjau
                      </Label>
                      <audio
                        controls
                        key={selectedExistingAudio}
                        src={`${process.env.NEXT_PUBLIC_API_URL}/${selectedExistingAudio}`}
                        className="w-full mt-1 h-10"
                      >
                        Browser Anda tidak mendukung audio.
                      </audio>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="col-span-4 text-center text-sm text-red-500">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
