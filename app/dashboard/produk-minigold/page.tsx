"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Tipe Data Produk
type Product = {
  id_produk: number;
  nama_produk: string;
  series_produk: string;
  gramasi_produk: string;
  harga_produk: string; // Harga Jual
  harga_buyback: string | null;
  harga_bandar: string | null;
  stok_produk: number;
  is_active: boolean;
};

// Tipe untuk baris CSV
type CsvRow = {
  ID: string;
  Nama: string;
  Series: string;
  Gramasi: string;
  "Harga Jual": string;
  "Harga Buyback": string;
  "Harga Bandar": string;
};

// Konstanta Series yang diizinkan (DI LUAR komponen)
const ALLOWED_SERIES = ["MiniGold", "MaxiGold", "MiniGold Special"];

export default function ProdukMiniGoldPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Data dari API
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient("/api/admin/produk?limit=1000"); // Sesuaikan limit
      
      const miniGoldProducts = res.data.filter((p: Product) =>
        ALLOWED_SERIES.includes(p.series_produk)
      );

      setProducts(miniGoldProducts);
      setFilteredProducts(miniGoldProducts);
    } catch (error) {
      toast.error("Gagal memuat produk.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter Search Client-side
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.nama_produk.toLowerCase().includes(lowerSearch) ||
        p.gramasi_produk.toLowerCase().includes(lowerSearch) ||
        p.series_produk.toLowerCase().includes(lowerSearch)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const formatCurrency = (val: string | number | null) => {
    if (!val) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(val));
  };

  // --- LOGIKA EXPORT CSV/EXCEL ---
  const handleExport = async () => {
    if (filteredProducts.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Harga");

    // Header Kolom
    worksheet.columns = [
      { header: "ID (JANGAN UBAH)", key: "id", width: 15 },
      { header: "Nama Produk", key: "nama", width: 30 },
      { header: "Series", key: "series", width: 20 },
      { header: "Gramasi", key: "gramasi", width: 15 },
      { header: "Harga Jual", key: "harga_jual", width: 20 },
      { header: "Harga Buyback", key: "harga_buyback", width: 20 },
      { header: "Harga Bandar", key: "harga_bandar", width: 20 },
    ];

    // Isi Data
    filteredProducts.forEach((p) => {
      worksheet.addRow({
        id: p.id_produk,
        nama: p.nama_produk,
        series: p.series_produk,
        gramasi: p.gramasi_produk,
        harga_jual: Number(p.harga_produk),
        harga_buyback: Number(p.harga_buyback || 0),
        harga_bandar: Number(p.harga_bandar || 0),
      });
    });

    // Style Header
    worksheet.getRow(1).font = { bold: true };

    // Generate File CSV
    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: "text/csv;charset=utf-8;" });
    const dateStr = new Date().toISOString().split("T")[0];
    saveAs(blob, `Update_Harga_MiniGold_${dateStr}.csv`);
  };

  // --- LOGIKA IMPORT CSV ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Parser CSV Sederhana
  const parseCSV = (text: string): CsvRow[] => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    
    const result: CsvRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      
      if (!currentLine) continue;

      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        const val = currentLine[index] ? currentLine[index].replace(/^"|"$/g, '').trim() : "";
        
        if (header.includes("ID")) obj["ID"] = val;
        else if (header.includes("Nama")) obj["Nama"] = val;
        else if (header.includes("Series")) obj["Series"] = val;
        else if (header.includes("Gramasi")) obj["Gramasi"] = val;
        else if (header.includes("Harga Jual")) obj["Harga Jual"] = val;
        else if (header.includes("Harga Buyback")) obj["Harga Buyback"] = val;
        else if (header.includes("Harga Bandar")) obj["Harga Bandar"] = val;
      });
      
      if (obj.ID) result.push(obj as unknown as CsvRow);
    }
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        
        if (data.length === 0) {
            toast.error("Format CSV tidak valid atau kosong.");
            setIsUploading(false);
            return;
        }

        await processBulkUpdate(data);
      } catch (err) {
        toast.error("Gagal membaca file CSV.");
        console.error(err);
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const processBulkUpdate = async (data: CsvRow[]) => {
    let successCount = 0;
    let failCount = 0;

    const updates = data.map(async (row) => {
      if (!row.ID) return;

      try {
        // [PERBAIKAN UTAMA]
        // Kita hanya mengirim data HARGA.
        // Data Nama, Series, dan Gramasi TIDAK dikirim.
        // Karena service backend kita sudah dinamis, maka field yang tidak dikirim
        // tidak akan di-update di database. Ini mencegah data teks berubah/rusak.
        
        await apiClient(`/api/admin/produk/${row.ID}/details`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // HAPUS atau KOMENTARI baris ini agar nama/detail produk AMAN
                // nama_produk: row.Nama, 
                // series_produk: row.Series,
                // gramasi_produk: row.Gramasi,
                
                // HANYA UPDATE HARGA
                harga_produk: String(row["Harga Jual"]).replace(/[^0-9.]/g, ''),
                harga_buyback: String(row["Harga Buyback"]).replace(/[^0-9.]/g, ''),
                harga_bandar: String(row["Harga Bandar"]).replace(/[^0-9.]/g, ''),
            })
        });

        successCount++;
      } catch (err) {
        console.error(`Gagal update ID ${row.ID}`, err);
        failCount++;
      }
    });

    await Promise.all(updates);

    setIsUploading(false);
    toast.success(`Update Selesai. Sukses: ${successCount}, Gagal: ${failCount}`);
    fetchProducts();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produk MiniGold</h1>
          <p className="text-muted-foreground">
            Kelola harga khusus untuk series MiniGold, MaxiGold, dan Special.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Download Template CSV
          </Button>
          <Button onClick={handleImportClick} disabled={isUploading || isLoading}>
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload CSV & Update
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga & Stok</CardTitle>
          <CardDescription>
            Menampilkan {filteredProducts.length} produk.
          </CardDescription>
          <div className="pt-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau gramasi..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Series</TableHead>
                  <TableHead>Gramasi</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Harga Buyback</TableHead>
                  <TableHead className="text-right">Harga Bandar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id_produk}>
                      <TableCell>{product.id_produk}</TableCell>
                      <TableCell className="font-medium">
                        {product.nama_produk}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.series_produk}</Badge>
                      </TableCell>
                      <TableCell>{product.gramasi_produk}</TableCell>
                      <TableCell>
                         <span className={product.stok_produk === 0 ? "text-red-500 font-bold" : ""}>
                            {product.stok_produk}
                         </span>
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {formatCurrency(product.harga_produk)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(product.harga_buyback)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(product.harga_bandar)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Tidak ada produk ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}