"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Tipe data tetap sama
type RawWilayahItem = {
  id: string;
  nama?: string;
  provinsi?: string;
  kabupaten_kota?: string;
  kecamatan?: string;
  kelurahan?: string;
};

type Wilayah = {
  id: string;
  nama: string;
};

type Bandar = {
  user_id: number;
  nama_lengkap: string;
  email: string;
  nomor_telepon: string | null;
  managed_region: string;
  detail_alamat?: string | null;
};

interface BandarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bandarToEdit?: Bandar | null;
}

const API_WILAYAH_URL = "https://apiv2.silverium.id/wilayah";

const fetchWilayah = async (url: string): Promise<Wilayah[]> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      return data.data.map((item: RawWilayahItem) => ({
        id: item.id,
        nama:
          item.provinsi ||
          item.kabupaten_kota ||
          item.kecamatan ||
          item.kelurahan ||
          item.nama ||
          "",
      }));
    }
    return [];
  } catch (e) {
    console.error("Gagal fetch wilayah:", e);
    return []; // Di aplikasi nyata, pertimbangkan untuk melempar error di sini
  }
};

export default function BandarFormModal({
  isOpen,
  onClose,
  onSuccess,
  bandarToEdit,
}: BandarFormModalProps) {
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    email: "",
    password: "",
    nomor_telepon: "",
    detail_alamat: "",
  });

  // State untuk menyimpan list data dari API
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [cities, setCities] = useState<Wilayah[]>([]);
  const [districts, setDistricts] = useState<Wilayah[]>([]);
  const [villages, setVillages] = useState<Wilayah[]>([]);

  // --- PERBAIKAN 1: Simpan hanya ID, bukan seluruh objek ---
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!bandarToEdit;

  // --- PERBAIKAN 2: Gunakan useMemo untuk efisiensi ---
  // Mencari objek lengkap berdasarkan ID tanpa perlu state tambahan
  const selectedProvince = useMemo(
    () => provinces.find((p) => p.id === selectedProvinceId),
    [provinces, selectedProvinceId]
  );
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId),
    [cities, selectedCityId]
  );
  const selectedDistrict = useMemo(
    () => districts.find((d) => d.id === selectedDistrictId),
    [districts, selectedDistrictId]
  );
  const selectedVillage = useMemo(
    () => villages.find((v) => v.id === selectedVillageId),
    [villages, selectedVillageId]
  );

  // Efek untuk mereset form saat modal dibuka/ditutup atau data edit berubah
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && bandarToEdit) {
        setFormData({
          nama_lengkap: bandarToEdit.nama_lengkap,
          email: bandarToEdit.email,
          password: "",
          nomor_telepon: bandarToEdit.nomor_telepon || "",
          detail_alamat: bandarToEdit.detail_alamat || "",
        });
      } else {
        setFormData({
          nama_lengkap: "",
          email: "",
          password: "",
          nomor_telepon: "",
          detail_alamat: "",
        });
      }
      setError(null);
      setSelectedProvinceId("");
      setCities([]);
      setSelectedCityId("");
      setDistricts([]);
      setSelectedDistrictId("");
      setVillages([]);
      setSelectedVillageId("");

      const getProvinces = async () => {
        const data = await fetchWilayah(`${API_WILAYAH_URL}/provinsi`);
        setProvinces(data);
      };
      getProvinces();
    }
  }, [bandarToEdit, isEditMode, isOpen]);

  // Efek berantai untuk mengambil data wilayah
  useEffect(() => {
    if (selectedProvinceId) {
      setCities([]);
      setSelectedCityId("");
      setDistricts([]);
      setSelectedDistrictId("");
      setVillages([]);
      setSelectedVillageId("");
      const getCities = async () => {
        const data = await fetchWilayah(
          `${API_WILAYAH_URL}/kabupaten-kota/${selectedProvinceId}`
        );
        setCities(data);
      };
      getCities();
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedCityId) {
      setDistricts([]);
      setSelectedDistrictId("");
      setVillages([]);
      setSelectedVillageId("");
      const getDistricts = async () => {
        const data = await fetchWilayah(
          `${API_WILAYAH_URL}/kecamatan/${selectedCityId}`
        );
        setDistricts(data);
      };
      getDistricts();
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (selectedDistrictId) {
      setVillages([]);
      setSelectedVillageId("");
      const getVillages = async () => {
        const data = await fetchWilayah(
          `${API_WILAYAH_URL}/kelurahan/${selectedDistrictId}`
        );
        setVillages(data);
      };
      getVillages();
    }
  }, [selectedDistrictId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEditMode && !formData.password) {
      setError("Password wajib diisi untuk bandar baru.");
      return;
    }
    if (!selectedCityId) {
      setError("Provinsi dan Kota/Kabupaten wajib dipilih.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("admin_access_token");
    const apiUrl = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bandars/${bandarToEdit?.user_id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bandars`;
    const method = isEditMode ? "PUT" : "POST";

    const bodyToSend: { [key: string]: string | null } = {
      ...formData,
      provinsi: selectedProvince?.nama ?? null,
      kota: selectedCity?.nama ?? null,
      kecamatan: selectedDistrict?.nama ?? null,
      kelurahan: selectedVillage?.nama ?? null,
    };

    if (isEditMode && !bodyToSend.password) {
      delete bodyToSend.password;
    }

    // --- LANGKAH DEBUGGING: Cek data sebelum dikirim ---
    console.log("Data yang akan dikirim ke backend:", bodyToSend);

    try {
      const res = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyToSend),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan yang tidak diketahui"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Bandar" : "Tambah Bandar Baru"}
          </DialogTitle>
          <DialogDescription>
            Isi detail informasi bandar dan wilayah kelolanya di bawah ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Input fields for nama, email, password, no. hp */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nama_lengkap" className="text-right">
              Nama
            </Label>
            <Input
              id="nama_lengkap"
              name="nama_lengkap"
              value={formData.nama_lengkap}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={isEditMode ? "Isi untuk ganti" : ""}
              className="col-span-3"
              required={!isEditMode}
              onChange={handleChange}
              value={formData.password}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nomor_telepon" className="text-right">
              No. HP
            </Label>
            <Input
              id="nomor_telepon"
              name="nomor_telepon"
              value={formData.nomor_telepon}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          <div className="pt-4 border-t space-y-4">
            {/* --- PERBAIKAN 4: Ubah `value` dan `onValueChange` di semua Select --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Provinsi</Label>
              <Select
                onValueChange={setSelectedProvinceId}
                value={selectedProvinceId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Provinsi..." />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kota/Kab</Label>
              <Select
                onValueChange={setSelectedCityId}
                value={selectedCityId}
                disabled={!selectedProvinceId || cities.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Kota/Kab..." />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kecamatan</Label>
              <Select
                onValueChange={setSelectedDistrictId}
                value={selectedDistrictId}
                disabled={!selectedCityId || districts.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Kecamatan..." />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kelurahan</Label>
              <Select
                onValueChange={setSelectedVillageId}
                value={selectedVillageId}
                disabled={!selectedDistrictId || villages.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Kelurahan..." />
                </SelectTrigger>
                <SelectContent>
                  {villages.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="detail_alamat" className="text-right pt-2">
                Alamat Lengkap
              </Label>
              <Textarea
                id="detail_alamat"
                name="detail_alamat"
                placeholder="Contoh: Jl. Sudirman No. 123, RT 01/RW 02..."
                value={formData.detail_alamat}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center pt-2">{error}</p>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
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
