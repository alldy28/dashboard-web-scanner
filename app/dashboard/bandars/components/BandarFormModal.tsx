"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type Bandar = {
  user_id: number;
  nama_lengkap: string;
  email: string;
  nomor_telepon: string | null;
  managed_region: string;
};

interface BandarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bandarToEdit?: Bandar | null;
}

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
    managed_region: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!bandarToEdit;

  useEffect(() => {
    if (isOpen) {
      // Hanya update form saat modal dibuka
      if (isEditMode && bandarToEdit) {
        setFormData({
          nama_lengkap: bandarToEdit.nama_lengkap,
          email: bandarToEdit.email,
          password: "",
          nomor_telepon: bandarToEdit.nomor_telepon || "",
          managed_region: bandarToEdit.managed_region,
        });
      } else {
        setFormData({
          nama_lengkap: "",
          email: "",
          password: "",
          nomor_telepon: "",
          managed_region: "",
        });
      }
      setError(null); // Selalu reset error saat modal dibuka
    }
  }, [bandarToEdit, isEditMode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nama_lengkap || !formData.email || !formData.managed_region) {
      setError("Nama, Email, dan Wilayah wajib diisi.");
      return;
    }
    if (!isEditMode && !formData.password) {
      setError("Password wajib diisi untuk bandar baru.");
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem("admin_access_token");
    const apiUrl = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bandars/${bandarToEdit?.user_id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bandars`;

    const method = isEditMode ? "PUT" : "POST";

    const body: Record<string, string> = { ...formData };
    if (isEditMode && !body.password) {
      delete body.password;
    }

    try {
      const res = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");

      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui");
      }
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
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="managed_region" className="text-right">
                Wilayah
              </Label>
              <Input
                id="managed_region"
                name="managed_region"
                value={formData.managed_region}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <DialogFooter>
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
