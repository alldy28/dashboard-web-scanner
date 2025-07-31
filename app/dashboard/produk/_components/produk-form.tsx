"use client";

import { useState, useEffect } from "react";
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

// Definisikan tipe data untuk produk
type Product = {
  id_produk?: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  fineness: string;
  harga_produk: string;
  tahun_pembuatan: number;
  upload_gambar?: string | null;
  upload_audio?: string | null;
};

// Definisikan props untuk komponen form
interface ProdukFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Product | null;
}

export function ProdukForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProdukFormProps) {
  // State untuk data form teks
  const [formData, setFormData] = useState({
    nama_produk: "",
    series_produk: "",
    gramasi_produk: "",
    fineness: "",
    harga_produk: "",
    tahun_pembuatan: new Date().getFullYear(),
  });

  // State untuk file dan pilihan audio
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [audioOption, setAudioOption] = useState("none"); // Default ke 'none'
  const [existingAudios, setExistingAudios] = useState<string[]>([]);
  const [selectedExistingAudio, setSelectedExistingAudio] =
    useState<string>("");
  const [selectedNewAudioFile, setSelectedNewAudioFile] = useState<File | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect untuk mengisi form saat mode edit
  useEffect(() => {
    if (initialData) {
      setFormData({
        nama_produk: initialData.nama_produk,
        series_produk: initialData.series_produk,
        gramasi_produk: initialData.gramasi_produk,
        fineness: initialData.fineness || "",
        harga_produk: String(initialData.harga_produk),
        tahun_pembuatan: initialData.tahun_pembuatan,
      });
      // Jika produk sudah punya audio, set opsi ke 'select'
      if (initialData.upload_audio) {
        setAudioOption("select");
        setSelectedExistingAudio(initialData.upload_audio);
      } else {
        setAudioOption("none"); // Jika tidak ada audio, set ke 'none'
      }
    } else {
      // Reset form saat mode tambah
      setFormData({
        nama_produk: "",
        series_produk: "",
        gramasi_produk: "",
        fineness: "",
        harga_produk: "",
        tahun_pembuatan: new Date().getFullYear(),
      });
      setAudioOption("none"); // Default ke 'none'
    }
    setSelectedImageFile(null);
    setSelectedNewAudioFile(null);
    setError(null);
  }, [initialData, isOpen]);

  // useEffect untuk mengambil daftar audio yang sudah ada
  useEffect(() => {
    if (isOpen) {
      const fetchAudioFiles = async () => {
        const token = localStorage.getItem("admin_token");
        try {
          const response = await fetch(
            "https://zh8r77hb-3000.asse.devtunnels.ms/api/audio-files",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok) throw new Error("Gagal mengambil daftar audio.");
          const data = await response.json();
          setExistingAudios(data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchAudioFiles();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImageFile(e.target.files[0]);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedNewAudioFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("admin_token");
    if (!token) {
      setError("Sesi tidak valid. Silakan login kembali.");
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    // Append data teks
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value));
    });

    if (selectedImageFile) {
      data.append("gambar", selectedImageFile);
    }

    // Logika untuk mengirim audio
    if (audioOption === "select" && selectedExistingAudio) {
      data.append("existing_audio_path", selectedExistingAudio);
    } else if (audioOption === "upload" && selectedNewAudioFile) {
      data.append("audio", selectedNewAudioFile);
    } else if (audioOption === "none") {
      // Kirim string kosong untuk menandakan tidak ada audio
      data.append("existing_audio_path", "");
    }

    const apiUrl = initialData?.id_produk
      ? `https://zh8r77hb-3000.asse.devtunnels.ms/api/produk/${initialData.id_produk}`
      : "https://zh8r77hb-3000.asse.devtunnels.ms/api/produk";
    const method = initialData?.id_produk ? "PUT" : "POST";

    try {
      const response = await fetch(apiUrl, {
        method,
        body: data,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Terjadi kesalahan");
      }
      onSuccess();
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi detail di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>

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
            <Input
              id="series_produk"
              name="series_produk"
              value={formData.series_produk}
              onChange={handleChange}
              className="col-span-3"
            />
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
              Harga (Rp)
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
            <Label htmlFor="gambar" className="text-right">
              Gambar
            </Label>
            <Input
              id="gambar"
              name="gambar"
              type="file"
              onChange={handleImageFileChange}
              className="col-span-3"
            />
          </div>
          {initialData?.upload_gambar && !selectedImageFile && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div />
              <div className="col-span-3">
                <p className="text-sm text-gray-500">Gambar saat ini:</p>
                <img
                  src={`https://zh8r77hb-3000.asse.devtunnels.ms/${initialData.upload_gambar}`}
                  alt="Gambar Produk"
                  className="h-20 w-20 object-cover mt-1 rounded-md"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Audio</Label>
            <RadioGroup
              value={audioOption}
              onValueChange={setAudioOption}
              className="col-span-3 flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">Tidak Ada Audio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="upload" />
                <Label htmlFor="upload">Upload Baru</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="select" id="select" />
                <Label htmlFor="select">Pilih yang Ada</Label>
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
                onChange={handleAudioFileChange}
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
                    {existingAudios.map((audioPath) => (
                      <SelectItem key={audioPath} value={audioPath}>
                        {audioPath.replace("uploads/", "")}
                      </SelectItem>
                    ))}
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
                      src={`https://zh8r77hb-3000.asse.devtunnels.ms/${selectedExistingAudio}`}
                      className="w-full mt-1 h-10"
                    >
                      Browser Anda tidak mendukung elemen audio.
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
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
