"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// --- [PERBAIKI] Helper Klien API Sederhana ---
const API_BASE_PATH = "https://apiv2.silverium.id/api/bandar"; // Ini sudah benar

const apiClient = async (endpoint: string, method: string, body?: unknown) => {
  // [TAMBAHAN] 1. Ambil token dari Local Storage
  // (Pastikan nama 'accessToken' sesuai dengan yang Anda simpan saat login)
  const token = localStorage.getItem("bandar_access_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // [TAMBAHAN] 2. Tambahkan token ke header Authorization jika ada
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    // [OPSIONAL] Jika Anda menyimpan token di cookie httpOnly,
    // hapus bagian token di atas dan gunakan baris ini:
    // credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_PATH}${endpoint}`, options);

  const data = await response.json();

  if (!response.ok) {
    // Ambil pesan error dari body API jika ada, atau gunakan status default
    throw new Error(data.message || "Terjadi kesalahan pada server.");
  }

  return data;
};

// ... (Interface UserProfile tetap sama)
interface UserProfile {
  name: string;
  email: string;
  alamat: string;
  no_telp: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    alamat: "",
    no_telp: "",
  });
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // State untuk form ubah password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Efek untuk mengambil data user saat ini
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiClient("/me", "GET");

        if (data.status === "success" && data.data.user) {
          // [PERBAIKI] Set state dengan data yang sudah di-mapping dari service
          // (Service Anda mengembalikan 'name', 'email', 'alamat', 'no_telp')
          setProfile(data.data.user);
        }
      } catch (error: unknown) {
        toast.error("Gagal Mengambil Data", {
          description:
            error instanceof Error
              ? error.message
              : "Tidak dapat terhubung ke server.",
        });
      } finally {
        setIsDataFetched(true);
      }
    }

    fetchProfile();
  }, []);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fungsi untuk mengirim update profil ke API
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);

    try {
      // Panggil endpoint PATCH /api/bandar/me
      const data = await apiClient("/me", "PUT", profile);

      if (data.status === "success" && data.data.user) {
        setProfile(data.data.user); // Perbarui state dengan data terbaru dari server
      }

      toast.success("Sukses!", {
        description: "Profil Anda telah berhasil diperbarui.",
      });
    } catch (error: unknown) {
      toast.error("Gagal Memperbarui Profil", {
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Fungsi untuk mengirim ubah password ke API
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Password Baru Tidak Cocok", {
        description: "Password baru dan konfirmasi password harus sama.",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password Terlalu Pendek", {
        description: "Password baru minimal harus 8 karakter.",
      });
      return;
    }

    setIsPasswordLoading(true);

    try {
      // Panggil endpoint POST /api/bandar/change-password
      await apiClient("/change-password", "POST", {
        oldPassword,
        newPassword,
      });

      toast.success("Sukses!", {
        description: "Password Anda telah berhasil diubah.",
      });

      // Kosongkan field password
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast.error("Gagal Mengubah Password", {
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  if (!isDataFetched) {
    // Tampilkan loading skeleton selagi data diambil
    // (Ini akan memanggil app/bandar-dashboard/profile/loading.tsx secara otomatis)
    return null;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Profil Saya</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kartu Edit Profil */}
        <Card>
          <form onSubmit={handleUpdateProfile}>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Perbarui informasi kontak dan alamat Anda di sini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  value={profile.name || ""} // Menangani nilai null/undefined
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  disabled
                  name="email"
                  type="email"
                  value={profile.email || ""}
                  // onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_telp">Nomor Telepon</Label>
                <Input
                  id="no_telp"
                  name="no_telp"
                  value={profile.no_telp || ""}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat Lengkap</Label>
                <Textarea
                  id="alamat"
                  name="alamat"
                  value={profile.alamat || ""}
                  onChange={handleProfileChange}
                  placeholder="Masukkan alamat lengkap Anda..."
                />
              </div>
            </CardContent>
            <br />
            <CardFooter>
              <Button type="submit" disabled={isProfileLoading}>
                {isProfileLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Kartu Ubah Password */}
        <Card>
          <form onSubmit={handleChangePassword}>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Ganti password Anda secara berkala untuk menjaga keamanan akun.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Password Lama</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Konfirmasi Password Baru
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <br />
            <CardFooter>
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? "Menyimpan..." : "Ubah Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
