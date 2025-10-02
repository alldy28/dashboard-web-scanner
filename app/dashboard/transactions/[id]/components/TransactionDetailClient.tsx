"use client";

import TransactionStatus from "./TransactionStatus";
import AdminActions from "./AdminActions";
import PrintLabel from "./PrintLabel";
import UploadProof from "./UploadProof";
import Image from "next/image";

// Tipe data untuk detail transaksi
type TransactionDetail = {
  transaction_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  bandar_name: string | null;
  type: "buy_digital" | "buyback" | "physical_print";
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in_transit"
    | "ready_for_pickup"
    | "completed";
  amount: number;
  price_per_gram: number | null;
  total_price: number | null;
  details: Record<string, unknown> | null;
  payment_proof_url: string | null;
  admin_proof_url: string | null;
  created_at: string;
  approved_at: string | null;
};

interface TransactionDetailClientProps {
  transaction: TransactionDetail;
}

export default function TransactionDetailClient({
  transaction,
}: TransactionDetailClientProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Fungsi untuk merender blok Aksi Admin secara dinamis
  const renderAdminActions = () => {
    // Jika status 'pending', tampilkan aksi persetujuan.
    if (transaction.status === "pending") {
      return <AdminActions transaction={transaction} />;
    }
    // Jika BUKAN 'pending' dan tipenya 'physical_print', tampilkan aksi logistik.
    if (transaction.type === "physical_print") {
      return (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-md font-medium text-gray-800">
            Logistik Cetak Fisik
          </h4>
          {/* Tampilkan opsi upload/kirim jika sudah disetujui */}
          {(transaction.status === "approved" ||
            transaction.status === "in_transit") && (
            <UploadProof
              transactionId={transaction.transaction_id}
              existingProofUrl={transaction.admin_proof_url}
            />
          )}
          <PrintLabel transactionId={transaction.transaction_id} />
        </div>
      );
    }
    // Jika kondisi di atas tidak terpenuhi, tampilkan pesan default.
    return (
      <p className="text-sm text-gray-500">
        Tidak ada aksi yang tersedia untuk transaksi ini.
      </p>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Detail Transaksi #{transaction.transaction_id}
        </h1>
        <p className="text-sm text-gray-500">
          Dibuat pada:{" "}
          {new Date(transaction.created_at).toLocaleString("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </div>

      {/* Kartu Informasi Transaksi */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Informasi Transaksi
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <TransactionStatus status={transaction.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Tipe Transaksi
            </dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">
              {transaction.type.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Jumlah</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {transaction.amount} gram
            </dd>
          </div>

          {/* Logika Tampilan Harga */}
          {transaction.type === "physical_print" ? (
            <div>
              <dt className="text-sm font-medium text-gray-900">
                Total Biaya Cetak
              </dt>
              <dd className="mt-1 text-sm font-bold text-gray-900">
                {transaction.total_price
                  ? new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(transaction.total_price)
                  : "-"}
              </dd>
            </div>
          ) : (
            <>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Harga per Gram
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {transaction.price_per_gram
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(transaction.price_per_gram)
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">
                  Total Harga
                </dt>
                <dd className="mt-1 text-sm font-bold text-gray-900">
                  {transaction.total_price
                    ? new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(transaction.total_price)
                    : "-"}
                </dd>
              </div>
            </>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500">
              Bandar Terkait
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {transaction.bandar_name ||
                (transaction.type !== "physical_print" ? "Pusat" : "-")}
            </dd>
          </div>
        </div>
      </div>

      {/* Kartu Informasi Konsumen */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Informasi Konsumen
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nama</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {transaction.customer_name}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {transaction.customer_email}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Telepon</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {transaction.customer_phone || "-"}
            </dd>
          </div>
        </div>
      </div>

      {/* Kartu Bukti Pembayaran & Pengiriman */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {transaction.payment_proof_url && (
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Bukti Pembayaran Konsumen
            </h3>
            <a
              href={`${API_URL}/${transaction.payment_proof_url}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${API_URL}/${transaction.payment_proof_url}`}
                alt="Bukti Pembayaran"
                width={300}
                height={200}
                className="rounded-lg border object-cover"
              />
            </a>
          </div>
        )}
        {transaction.admin_proof_url && (
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Bukti Pengiriman Admin
            </h3>
            <a
              href={`${API_URL}/${transaction.admin_proof_url}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`${API_URL}/${transaction.admin_proof_url}`}
                alt="Bukti Pengiriman"
                width={300}
                height={200}
                className="rounded-lg border object-cover"
              />
            </a>
          </div>
        )}
      </div>

      {/* Kartu Aksi Admin */}
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Aksi Admin
        </h3>
        <div className="mt-4 space-y-4">{renderAdminActions()}</div>
      </div>
    </div>
  );
}
