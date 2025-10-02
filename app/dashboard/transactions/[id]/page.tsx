"use client";

import { useEffect, useState, useCallback } from "react";

// --- Komponen Ikon SVG (Pengganti Lucide-React untuk portabilitas) ---
const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const Info = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const User = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const FileText = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const Upload = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// --- Tipe Data ---
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

type AdminActionProps = {
  transaction: TransactionDetail;
  onSuccess: () => void;
};

type UploadProofProps = {
  transactionId: number;
  existingProofUrl: string | null;
  onSuccess: () => void;
};

// --- Komponen Anak Fungsional (digabungkan untuk mengatasi error impor) ---
const TransactionStatus = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: string } = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    in_transit: "bg-cyan-100 text-cyan-800",
    ready_for_pickup: "bg-purple-100 text-purple-800",
    completed: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        statusStyles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};

const AdminActions = ({ transaction, onSuccess }: AdminActionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleAction = async (action: "approve" | "reject") => {
    setIsSubmitting(true);
    const token = localStorage.getItem("admin_access_token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${action}/${transaction.transaction_id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Gagal ${action} transaksi`);
      alert(
        `Transaksi berhasil di-${action === "approve" ? "setujui" : "tolak"}.`
      );
      onSuccess();
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-2">
      <button
        onClick={() => handleAction("approve")}
        disabled={isSubmitting}
        className="w-full flex justify-center bg-green-500 hover:bg-green-600 text-white p-2 rounded transition-colors disabled:bg-gray-400"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Setujui"
        )}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={isSubmitting}
        className="w-full flex justify-center bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors disabled:bg-gray-400"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Tolak"}
      </button>
    </div>
  );
};

const UploadProof = ({
  transactionId,
  existingProofUrl,
  onSuccess,
}: UploadProofProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!file) {
      alert("Silakan pilih file terlebih dahulu.");
      return;
    }
    setIsUploading(true);
    const token = localStorage.getItem("admin_access_token");
    const formData = new FormData();
    formData.append("proofImage", file);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${transactionId}/upload-proof`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah bukti");
      alert("Bukti berhasil diunggah.");
      onSuccess();
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`
      );
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="space-y-3">
      {existingProofUrl && (
        <p className="text-xs text-gray-500">
          Bukti sudah ada. Unggah file baru akan menimpa yang lama.
        </p>
      )}
      <input
        type="file"
        onChange={handleFileChange}
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full flex justify-center bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors disabled:bg-gray-400"
      >
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Unggah"}
      </button>
    </div>
  );
};

const PrintLabel = ({ transactionId }: { transactionId: number }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrint = async () => {
    setIsPrinting(true);
    const token = localStorage.getItem("admin_access_token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/transactions/${transactionId}/label`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Gagal mengunduh label PDF.");
      const pdfBlob = await res.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`
      );
    } finally {
      setIsPrinting(false);
    }
  };
  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className="w-full flex justify-center items-center bg-gray-600 hover:bg-gray-700 text-white p-2 rounded transition-colors disabled:bg-gray-400"
    >
      {isPrinting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        "Cetak Label Pengiriman"
      )}
    </button>
  );
};

// --- Fungsi Helper & Komponen UI Lainnya ---
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
};
const formatTransactionType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const InfoCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white shadow-sm sm:rounded-lg p-6">
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="text-lg font-semibold leading-6 text-gray-900 ml-3">
        {title}
      </h3>
    </div>
    <div className="border-t border-gray-200 pt-4">{children}</div>
  </div>
);

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
      {children}
    </dd>
  </div>
);

const ProofImageCard = ({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string;
}) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  return (
    <InfoCard
      title={title}
      icon={<FileText className="h-6 w-6 text-gray-500" />}
    >
      <a
        href={`${API_URL}/${imageUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={`${API_URL}/${imageUrl}`}
          alt={title}
          width={300}
          height={200}
          className="rounded-lg border object-cover hover:opacity-80 transition-opacity"
        />
      </a>
    </InfoCard>
  );
};

const AdminActionSection = ({
  transaction,
  onActionSuccess,
}: {
  transaction: TransactionDetail;
  onActionSuccess: () => void;
}) => {
  if (transaction.type === "buy_digital" && transaction.status === "pending") {
    return (
      <AdminActions transaction={transaction} onSuccess={onActionSuccess} />
    );
  }
  if (
    (transaction.type === "buyback" || transaction.type === "physical_print") &&
    transaction.status === "pending"
  ) {
    if (!transaction.admin_proof_url) {
      return (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">
            Langkah 1: Unggah Bukti
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Anda harus mengunggah bukti pembayaran/pengiriman sebelum dapat
            menyetujui transaksi ini.
          </p>
          <UploadProof
            transactionId={transaction.transaction_id}
            existingProofUrl={null}
            onSuccess={onActionSuccess}
          />
        </div>
      );
    } else {
      return (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">
            Langkah 2: Konfirmasi Transaksi
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Bukti telah diunggah. Sekarang Anda bisa menyelesaikan transaksi
            ini.
          </p>
          <AdminActions transaction={transaction} onSuccess={onActionSuccess} />
        </div>
      );
    }
  }
  if (
    transaction.type === "physical_print" &&
    (transaction.status === "approved" || transaction.status === "in_transit")
  ) {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">
            Logistik Cetak Fisik
          </h4>
          <UploadProof
            transactionId={transaction.transaction_id}
            existingProofUrl={transaction.admin_proof_url}
            onSuccess={onActionSuccess}
          />
        </div>
        <div className="pt-4 border-t">
          <PrintLabel transactionId={transaction.transaction_id} />
        </div>
      </div>
    );
  }
  return (
    <p className="text-sm text-gray-500">
      Tidak ada aksi yang tersedia untuk status transaksi ini.
    </p>
  );
};

// --- Komponen Halaman Utama ---
export default function TransactionDetailPage() {
  const [id, setId] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split("/");
      const transactionId = pathSegments[pathSegments.length - 1];
      if (transactionId) setId(transactionId);
    }
  }, []);

  const fetchTransaction = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      setError("Otentikasi gagal. Silakan login kembali.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/admin/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengambil detail transaksi");
      }
      const data = await res.json();
      setTransaction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchTransaction();
    else setIsLoading(false);
  }, [id, fetchTransaction]);

  if (isLoading)
    return (
      <div className="flex w-full items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!transaction) return <p className="p-6">Transaksi tidak ditemukan.</p>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Detail Transaksi #{transaction.transaction_id}
        </h1>
        <p className="text-sm text-gray-500">
          Dibuat pada: {formatDate(transaction.created_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InfoCard
            title="Informasi Transaksi"
            icon={<Info className="h-6 w-6 text-gray-500" />}
          >
            <dl className="space-y-2">
              <DetailRow label="Status">
                <TransactionStatus status={transaction.status} />
              </DetailRow>
              <DetailRow label="Tipe Transaksi">
                <span className="capitalize">
                  {formatTransactionType(transaction.type)}
                </span>
              </DetailRow>
              <DetailRow label="Jumlah">{transaction.amount} gram</DetailRow>
              <DetailRow
                label={
                  transaction.type === "physical_print"
                    ? "Total Biaya Cetak"
                    : "Total Harga"
                }
              >
                <span className="font-bold">
                  {formatCurrency(transaction.total_price)}
                </span>
              </DetailRow>
              <DetailRow label="Bandar Terkait">
                {transaction.bandar_name ||
                  (transaction.type !== "physical_print" ? "Pusat" : "-")}
              </DetailRow>
            </dl>
          </InfoCard>

          <InfoCard
            title="Informasi Konsumen"
            icon={<User className="h-6 w-6 text-gray-500" />}
          >
            <dl className="space-y-2">
              <DetailRow label="Nama">{transaction.customer_name}</DetailRow>
              <DetailRow label="Email">{transaction.customer_email}</DetailRow>
              <DetailRow label="Telepon">
                {transaction.customer_phone || "-"}
              </DetailRow>
            </dl>
          </InfoCard>

          {transaction.payment_proof_url && (
            <ProofImageCard
              title="Bukti Pembayaran Konsumen"
              imageUrl={transaction.payment_proof_url}
            />
          )}
          {transaction.admin_proof_url && (
            <ProofImageCard
              title="Bukti Pengiriman Admin"
              imageUrl={transaction.admin_proof_url}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <InfoCard
            title="Aksi Admin"
            icon={<Upload className="h-6 w-6 text-gray-500" />}
          >
            <AdminActionSection
              transaction={transaction}
              onActionSuccess={fetchTransaction}
            />
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
