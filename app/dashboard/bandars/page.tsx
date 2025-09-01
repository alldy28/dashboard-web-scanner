"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import BandarFormModal from "./components/BandarFormModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";

// Definisikan tipe data untuk objek Bandar
type Bandar = {
  user_id: number;
  nama_lengkap: string;
  email: string;
  nomor_telepon: string | null;
  managed_region: string;
};

export default function BandarsPage() {
  const [bandars, setBandars] = useState<Bandar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk mengontrol modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBandar, setSelectedBandar] = useState<Bandar | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fungsi lengkap untuk mengambil data dari API
  const fetchBandars = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      setError("Autentikasi gagal. Silakan login kembali.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bandars`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error("Gagal memuat data bandar.");
      }
      const data = await res.json();
      setBandars(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Panggil fungsi fetch saat komponen pertama kali dimuat
  useEffect(() => {
    fetchBandars();
  }, []);

  // Handler untuk membuka modal
  const handleOpenAddModal = () => {
    setSelectedBandar(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (bandar: Bandar) => {
    setSelectedBandar(bandar);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (bandar: Bandar) => {
    setSelectedBandar(bandar);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedBandar(null);
  };

  // Handler untuk konfirmasi hapus
  const handleDeleteConfirm = async () => {
    if (!selectedBandar) return;
    setIsDeleting(true);
    setError(null);

    const token = localStorage.getItem("admin_access_token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bandars/${selectedBandar.user_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menghapus bandar.");
      }

      await fetchBandars(); // Refresh list setelah berhasil hapus
      handleCloseModals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus bandar");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-semibold text-gray-900">
          Manajemen Bandar
        </h1>
        <Button onClick={handleOpenAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Bandar Baru
        </Button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 text-center p-3 bg-red-100 rounded-md">
          Error: {error}
        </p>
      )}

      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Lengkap
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wilayah Kelola
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bandars.length > 0 ? (
              bandars.map((bandar) => (
                <tr key={bandar.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {bandar.nama_lengkap}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{bandar.email}</div>
                    <div className="text-sm text-gray-500">
                      {bandar.nomor_telepon || "No. HP tidak ada"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bandar.managed_region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenEditModal(bandar)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleOpenDeleteModal(bandar)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">
                  Belum ada data bandar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BandarFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSuccess={fetchBandars}
        bandarToEdit={selectedBandar}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        bandarName={selectedBandar?.nama_lengkap || ""}
      />
    </div>
  );
}
