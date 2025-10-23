"use client";

import { useState, useEffect } from "react";

// Tipe data untuk jam operasional
type OperatingHour = {
  day_of_week: number;
  open_time: string; // Format "HH:mm:ss"
  close_time: string; // Format "HH:mm:ss"
  is_enabled: boolean;
};

// SESUAIKAN: Ganti dengan URL API admin Anda
const API_URL = "https://apiv2.silverium.id/api/admin/store-hours";

export default function StoreHoursPage() {
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  // 1. Ambil data dari API saat halaman dimuat
  useEffect(() => {
    const fetchHours = async () => {
      try {
        // PENTING: Anda mungkin perlu menambahkan token otentikasi
        const token = localStorage.getItem("admin_access_token");
        const response = await fetch(API_URL, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
        });
        if (!response.ok)
          throw new Error("Gagal mengambil data jam operasional");

        const data = await response.json();
        setHours(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchHours();
  }, []);

  // 2. Fungsi untuk mengubah data di state
  const handleChange = (
    index: number,
    field: keyof OperatingHour,
    value: string | boolean
  ) => {
    const newHours = [...hours];

    if (
      (field === "open_time" || field === "close_time") &&
      typeof value === "string"
    ) {
      // Input type="time" memberi "HH:mm", kita perlu "HH:mm:ss"
      // Penambahan ":00" hanya terjadi di sini.
      newHours[index][field] = `${value}:00`;
    } else if (field === "is_enabled" && typeof value === "boolean") {
      // TypeScript sekarang tahu 'value' adalah boolean
      newHours[index][field] = value;
    }

    setHours(newHours);
  };

  // 3. Fungsi untuk menyimpan perubahan ke API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_access_token");
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        // Kirim dalam format { hours: [...] } sesuai controller
        body: JSON.stringify({ hours: hours }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Gagal menyimpan data");
      }

      alert("Perubahan berhasil disimpan!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  if (loading && hours.length === 0) return <div>Memuat data...</div>;
  if (error && hours.length === 0) return <div>Error: {error}</div>;

  // 4. Render Form
  return (
    <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
      <h1>Pengaturan Jam Operasional Bandar</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {hours.map((day, index) => (
        <div
          key={day.day_of_week}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <h3>{days[day.day_of_week]}</h3>
          <div>
            <input
              type="checkbox"
              id={`check-${day.day_of_week}`}
              checked={day.is_enabled}
              onChange={(e) =>
                handleChange(index, "is_enabled", e.target.checked)
              }
            />
            <label
              htmlFor={`check-${day.day_of_week}`}
              style={{ marginLeft: "8px" }}
            >
              {day.is_enabled ? "Buka" : "Tutup"}
            </label>
          </div>
          <div style={{ marginTop: "10px" }}>
            <label htmlFor={`open-${day.day_of_week}`}>Jam Buka: </label>
            <input
              type="time" // Input ini menghasilkan "HH:mm"
              id={`open-${day.day_of_week}`}
              value={day.open_time.substring(0, 5)} // Ambil "HH:mm" dari "HH:mm:ss"
              disabled={!day.is_enabled}
              onChange={(e) => handleChange(index, "open_time", e.target.value)}
              style={{ marginRight: "15px" }}
            />
            <label htmlFor={`close-${day.day_of_week}`}>Jam Tutup: </label>
            <input
              type="time"
              id={`close-${day.day_of_week}`}
              value={day.close_time.substring(0, 5)} // Ambil "HH:mm" dari "HH:mm:ss"
              disabled={!day.is_enabled}
              onChange={(e) =>
                handleChange(index, "close_time", e.target.value)
              }
            />
          </div>
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        {loading ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
