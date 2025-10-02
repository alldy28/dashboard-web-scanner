"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Product, StockUpdateResponse } from "./produk-client"; // <-- PERBAIKAN: Impor dari produk-client

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
  product: Product | null;
}

export default function StockUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: StockUpdateModalProps) {
  const [newStock, setNewStock] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    if (product) {
      setNewStock(product.stok_produk?.toString() || "0");
    }
  }, [product]);

  const handleStockUpdate = async () => {
    if (!product) return;
    setIsUpdating(true);
    const token = localStorage.getItem("admin_access_token");

    try {
      const res = await fetch(
        `${API_URL}/api/admin/produk/${product.id_produk}/stok`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stok: newStock }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal memperbarui stok.");
      }

      const updatedStockInfo: StockUpdateResponse = await res.json();

      const fullUpdatedProduct: Product = {
        ...product, // Gabungkan data produk asli
        stok_produk: updatedStockInfo.stok_produk, // Timpa hanya dengan stok baru
      };

      onSuccess(fullUpdatedProduct);
      toast.success("Stok produk berhasil diperbarui.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Stok</DialogTitle>
          <DialogDescription>
            Masukkan jumlah stok baru untuk produk:{" "}
            <strong>{product?.nama_produk}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stok" className="text-right">
              Stok Baru
            </Label>
            <Input
              id="stok"
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleStockUpdate} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
