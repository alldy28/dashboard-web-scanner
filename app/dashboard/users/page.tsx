/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter, // Tambahan
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Search,
  User,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"; // Icon Panah
import { toast } from "sonner";

// Tipe Data User
type UserData = {
  user_id: number;
  nama_lengkap: string;
  email: string;
  nomor_telepon: string;
  is_verified: boolean;
  created_at: string;
  digital_silver_balance: string;
  avatar_url: string | null;
};

// [TAMBAHAN] Tipe untuk Pagination
type PaginationMeta = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // [MODIFIKASI] State Pagination & Search
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // [MODIFIKASI] Fetch Users dengan query params
  // Kita menggunakan debouncing manual sederhana untuk search
  const fetchUsers = useCallback(
    async (pageParams: number, searchParams: string) => {
      setIsLoading(true);
      const token = localStorage.getItem("admin_access_token");

      try {
        // Kirim parameter page & search ke backend
        const res = await fetch(
          `${API_URL}/api/admin/users?page=${pageParams}&limit=10&search=${searchParams}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) throw new Error("Gagal mengambil data user.");

        const responseJson = await res.json();

        setUsers(responseJson.data);
        setPagination(responseJson.pagination);
      } catch (error) {
        toast.error("Gagal memuat data pengguna.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL],
  );

  // Efek untuk memanggil data saat page berubah
  useEffect(() => {
    // Debounce search agar tidak memanggil API setiap ketikan huruf
    const handler = setTimeout(() => {
      fetchUsers(page, searchTerm);
    }, 500); // Tunggu 500ms setelah user berhenti mengetik

    return () => clearTimeout(handler);
  }, [page, searchTerm, fetchUsers]);

  const handleVerifyUser = async (userId: number) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin memverifikasi pengguna ini secara manual?",
      )
    )
      return;
    setVerifyingId(userId);
    const token = localStorage.getItem("admin_access_token");
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/verify`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Gagal.");
      toast.success("User berhasil diverifikasi.");
      // Refresh data di halaman saat ini
      fetchUsers(page, searchTerm);
    } catch (error) {
      toast.error("Gagal memverifikasi.");
    } finally {
      setVerifyingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Handler Ganti Halaman
  const handleNextPage = () => {
    if (page < pagination.totalPages) setPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Manajemen Pengguna
        </h1>
        <p className="text-muted-foreground">
          Daftar semua pengguna (konsumen) yang terdaftar di aplikasi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Menampilkan halaman {pagination.currentPage} dari{" "}
            {pagination.totalPages} ({pagination.totalItems} Total User)
          </CardDescription>
          <div className="pt-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, atau no. telp..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset ke halaman 1 saat mencari
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Saldo Perak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bergabung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage
                            src={
                              user.avatar_url
                                ? `${API_URL}/${user.avatar_url}`
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.nama_lengkap}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{user.email}</span>
                          <span className="text-muted-foreground text-xs">
                            {user.nomor_telepon}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {parseFloat(user.digital_silver_balance || "0").toFixed(
                          3,
                        )}{" "}
                        gr
                      </TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-200"
                          >
                            Verified
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-700 border-yellow-200"
                            >
                              Unverified
                            </Badge>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleVerifyUser(user.user_id)}
                              disabled={verifyingId === user.user_id}
                              title="Verifikasi Manual"
                            >
                              {verifyingId === user.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Tidak ada pengguna ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* [TAMBAHAN] Footer Pagination */}
        <CardFooter className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {users.length} of {pagination.totalItems} users
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= pagination.totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
