
"use client";

import React from "react";

export type BookingStatus =
  | "Signed Up - Lead Created"
  | "Book a shoot - Lead Created"
  | "Manual - Lead Created"
  | "Booking In Progress"
  | "Ready for Payment"
  | "Payment Sent"
  | "Proposal Sent"
  | "Booked"
  | "Closed – Lost"
  | "In-Progress"
  | "Paid"
  | "Cancelled"
  | "Unknown";

const BOOKING_STATUS_STYLES: Record<
  BookingStatus,
  { bg: string; text: string }
> = {
  "Signed Up - Lead Created": {
    bg: "bg-[#DBCFFF]",
    text: "text-[#744EE6]",
  },
  "Book a shoot - Lead Created": {
    bg: "bg-[#AAD0FF]",
    text: "text-[#0C52A8]",
  },
  "Manual - Lead Created": {
    bg: "bg-[#ADF4FF]",
    text: "text-[#1490A3]",
  },
  "Booking In Progress": {
    bg: "bg-[#FFF4C9]",
    text: "text-[#BA6605]",
  },
  "Proposal Sent": {
    bg: "bg-[#DFD7FE]",
    text: "text-[#6947E8]",
  },
  "Ready for Payment": {
    bg: "bg-[#FFCA9E]",
    text: "text-[#BE5C0B]",
  },
  "Payment Sent": {
    bg: "bg-[#86DAFF]",
    text: "text-[#0F77A6]",
  },
  "Booked": {
    bg: "bg-[#D4FFE4]",
    text: "text-[#16A34A]",
  },
  "Closed – Lost": {
    bg: "bg-[#FFB9B9]",
    text: "text-[#F03434]",
  },
  "In-Progress": {
    bg: "bg-[#FFF4C9]",
    text: "text-[#BA6605]",
  },
  "Paid": {
    bg: "bg-[#D4FFE4]",
    text: "text-[#16A34A]",
  },
  "Cancelled": {
    bg: "bg-[#FFB9B9]",
    text: "text-[#F03434]",
  },
  "Unknown": {
    bg: "bg-gray-200",
    text: "text-gray-600",
  },
};

interface StatusBadgeProps {
  status: BookingStatus;
}

export function LeadsStatusBadge({ status }: StatusBadgeProps) {
  const style = BOOKING_STATUS_STYLES[status] || BOOKING_STATUS_STYLES["Unknown"];

  return (
    <span
      className={`text-nowrap px-3 py-2 rounded-full text-sm lg:text-base font-medium ${style.bg} ${style.text}`}
    >
      {status || "Unknown"}
    </span>
  );
}
