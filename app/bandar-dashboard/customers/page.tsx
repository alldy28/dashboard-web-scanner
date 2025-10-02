"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input"; // Impor komponen Input

// Tipe data untuk objek pelanggan
type Customer = {
  user_id: number;
  nama_lengkap: string;
  email: string;
  nomor_telepon: string | null;
  digital_silver_balance: number;
  total_transactions: number;
};

export default function BandarCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalSilver, setTotalSilver] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // State baru untuk menyimpan input pencarian

  useEffect(() => {
    const fetchCustomerData = async () => {
      const token = localStorage.getItem("bandar_access_token");
      if (!token) {
        setError("Token tidak valid. Silakan login kembali.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bandar/customers-summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          throw new Error("Gagal mengambil data pelanggan.");
        }

        const data = await res.json();
        setCustomers(data.customer_list || []);
        setTotalSilver(data.total_digital_silver_in_region || 0);
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

    fetchCustomerData();
  }, []);

  // Logika untuk memfilter pelanggan berdasarkan input pencarian
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>;
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900">
          Daftar Pelanggan di Wilayah Anda
        </h1>
        <p className="text-sm text-gray-500">
          Total simpanan perak digital di wilayah Anda:{" "}
          <strong>{totalSilver.toFixed(4)} gram</strong>
        </p>
      </div>

      {/* Input Pencarian Ditambahkan di Sini */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari berdasarkan nama atau email..."
          className="w-full rounded-lg bg-background pl-8 md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Pelanggan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo Perak Digital
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Transaksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.nama_lengkap}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {customer.nomor_telepon || "No. HP tidak ada"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                    {parseFloat(
                      String(customer.digital_silver_balance)
                    ).toFixed(4)}{" "}
                    gram
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {customer.total_transactions}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">
                  <Users className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2">
                    {searchTerm
                      ? `Tidak ada pelanggan yang cocok dengan pencarian "${searchTerm}".`
                      : "Belum ada pelanggan yang terdaftar."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
