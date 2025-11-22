import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Package,
  ShoppingCart,
  HelpCircle,
} from "lucide-react";

export type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "in_transit"
  | "ready_for_pickup"
  | "completed"
  | "pre-order"
  | "pre-order-pending-payment";

interface TransactionStatusProps {
  status: Status | string;
}

export default function TransactionStatus({ status }: TransactionStatusProps) {
  // [PERBAIKI] Cek apakah status ada. Jika tidak (undefined/null), jangan crash.
  if (!status) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-100 text-gray-500 border-gray-200 flex w-fit items-center gap-1"
      >
        <HelpCircle className="h-3 w-3" />
        <span>Status Hilang</span>
      </Badge>
    );
  }

  // Normalisasi status ke lowercase untuk keamanan
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus === "pending" ||
    normalizedStatus === "pending-payment"
  ) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-100 text-yellow-800 border-yellow-200 flex w-fit items-center gap-1"
      >
        <Clock className="h-3 w-3" />
        <span>Menunggu</span>
      </Badge>
    );
  }

  if (normalizedStatus === "approved") {
    return (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 border-green-200 flex w-fit items-center gap-1"
      >
        <CheckCircle className="h-3 w-3" />
        <span>Disetujui</span>
      </Badge>
    );
  }

  if (normalizedStatus === "processing") {
    return (
      <Badge
        variant="outline"
        className="bg-blue-100 text-blue-800 border-blue-200 flex w-fit items-center gap-1"
      >
        <Package className="h-3 w-3" />
        <span>Diproses</span>
      </Badge>
    );
  }

  if (normalizedStatus === "in_transit") {
    return (
      <Badge
        variant="outline"
        className="bg-purple-100 text-purple-800 border-purple-200 flex w-fit items-center gap-1"
      >
        <Truck className="h-3 w-3" />
        <span>Dikirim</span>
      </Badge>
    );
  }

  if (normalizedStatus === "ready_for_pickup") {
    return (
      <Badge
        variant="outline"
        className="bg-indigo-100 text-indigo-800 border-indigo-200 flex w-fit items-center gap-1"
      >
        <Package className="h-3 w-3" />
        <span>Siap Diambil</span>
      </Badge>
    );
  }

  if (normalizedStatus === "completed") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-100 text-emerald-800 border-emerald-200 flex w-fit items-center gap-1"
      >
        <CheckCircle className="h-3 w-3" />
        <span>Selesai</span>
      </Badge>
    );
  }

  if (normalizedStatus === "rejected") {
    return (
      <Badge
        variant="outline"
        className="bg-red-100 text-red-800 border-red-200 flex w-fit items-center gap-1"
      >
        <XCircle className="h-3 w-3" />
        <span>Ditolak</span>
      </Badge>
    );
  }

  if (normalizedStatus.includes("pre-order")) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-100 text-orange-800 border-orange-200 flex w-fit items-center gap-1"
      >
        <ShoppingCart className="h-3 w-3" />
        <span>Pre-Order</span>
      </Badge>
    );
  }

  // Fallback untuk status yang tidak dikenali
  return (
    <Badge
      variant="outline"
      className="bg-gray-100 text-gray-800 border-gray-200 flex w-fit items-center gap-1"
    >
      <span>{status}</span>
    </Badge>
  );
}
