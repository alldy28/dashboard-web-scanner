"use client";

import React from "react";

type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "in_transit"
  | "ready_for_pickup"
  | "completed";

interface TransactionStatusProps {
  status: Status;
}

const statusStyles: Record<Status, { text: string; bg: string; dot: string }> =
  {
    pending: {
      text: "text-yellow-800",
      bg: "bg-yellow-100",
      dot: "bg-yellow-500",
    },
    approved: {
      text: "text-green-800",
      bg: "bg-green-100",
      dot: "bg-green-500",
    },
    in_transit: {
      text: "text-blue-800",
      bg: "bg-blue-100",
      dot: "bg-blue-500",
    },
    ready_for_pickup: {
      text: "text-indigo-800",
      bg: "bg-indigo-100",
      dot: "bg-indigo-500",
    },
    completed: {
      text: "text-gray-800",
      bg: "bg-gray-200",
      dot: "bg-gray-500",
    },
    rejected: {
      text: "text-red-800",
      bg: "bg-red-100",
      dot: "bg-red-500",
    },
  };

const TransactionStatus: React.FC<TransactionStatusProps> = ({ status }) => {
  const style = statusStyles[status] || statusStyles.completed;
  const statusText = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <svg
        className={`-ml-0.5 mr-1.5 h-2 w-2 ${style.dot}`}
        fill="currentColor"
        viewBox="0 0 8 8"
      >
        <circle cx={4} cy={4} r={3} />
      </svg>
      {statusText}
    </span>
  );
};

export default TransactionStatus;
