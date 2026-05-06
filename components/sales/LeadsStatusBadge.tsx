"use client";

import React from "react";

export type BookingStatus =
  | "Signed Up"
  | "Singed Up"
  | "Signed Up - Lead Created"
  | "Signed Up – Lead Created"
  | "Book a shoot - Lead Created"
  | "Book a shoot – Lead Created"
  | "Manual - Lead Created"
  | "Manual – Lead Created"
  | "Booking In Progress"
  | "Ready for Payment"
  | "Payment Sent"
  | "Payment Link Sent"
  | "Proposal Sent"
  | "Booked"
  | "Closed – Lost"
  | "Closed - Lost"
  | "In-Progress"
  | "Paid"
  | "Partially Paid"
  | "Cancelled"
  | "Unknown"
  | string;

const BOOKING_STATUS_STYLES: Record<
  string,
  { bg: string; text: string }
> = {
  // --- Signed Up Group ---
  "Signed Up": { bg: "bg-[#DBCFFF]", text: "text-[#744EE6]" },
  "Singed Up": { bg: "bg-[#DBCFFF]", text: "text-[#744EE6]" }, // Matches typo from backend
  "Signed Up - Lead Created": { bg: "bg-[#DBCFFF]", text: "text-[#744EE6]" },
  "Signed Up – Lead Created": { bg: "bg-[#DBCFFF]", text: "text-[#744EE6]" },

  // --- Book a Shoot Group ---
  "Book a shoot - Lead Created": { bg: "bg-[#AAD0FF]", text: "text-[#0C52A8]" },
  "Book a shoot – Lead Created": { bg: "bg-[#AAD0FF]", text: "text-[#0C52A8]" }, // With en-dash

  // --- Manual Lead Group ---
  "Manual - Lead Created": { bg: "bg-[#ADF4FF]", text: "text-[#1490A3]" },
  "Manual – Lead Created": { bg: "bg-[#ADF4FF]", text: "text-[#1490A3]" }, // With en-dash

  // --- Progress Group ---
  "Booking In Progress": { bg: "bg-[#FFF4C9]", text: "text-[#BA6605]" },
  "In-Progress": { bg: "bg-[#FFF4C9]", text: "text-[#BA6605]" },

  // --- Payment / Link Group ---
  "Proposal Sent": { bg: "bg-[#DFD7FE]", text: "text-[#6947E8]" },
  "Payment Link Sent": { bg: "bg-[#DFD7FE]", text: "text-[#6947E8]" }, // NEW: Uses Proposal Sent color
  "Payment Sent": { bg: "bg-[#86DAFF]", text: "text-[#0F77A6]" },
  "Link Sent": { bg: "bg-[#DFD7FE]", text: "text-[#6947E8]" },
  "Link Expired": { bg: "bg-[#FFE3B3]", text: "text-[#A16207]" },
  "Pending": { bg: "bg-[#FFF4C9]", text: "text-[#BA6605]" },
  "Unpaid": { bg: "bg-[#FFF4C9]", text: "text-[#BA6605]" },

  // --- Ready Group ---
  "Ready for Payment": { bg: "bg-[#FFCA9E]", text: "text-[#BE5C0B]" },

  // --- Success Group ---
  "Booked": { bg: "bg-[#D4FFE4]", text: "text-[#16A34A]" },
  "Paid": { bg: "bg-[#D4FFE4]", text: "text-[#16A34A]" },
  "Partially Paid": { bg: "bg-[#FFF4C9]", text: "text-[#BA6605]" },

  // --- Lost / Cancelled Group ---
  "Closed – Lost": { bg: "bg-[#FFB9B9]", text: "text-[#F03434]" },
  "Closed - Lost": { bg: "bg-[#FFB9B9]", text: "text-[#F03434]" }, // With normal hyphen
  "Cancelled": { bg: "bg-[#FFB9B9]", text: "text-[#F03434]" },

  // --- Fallback ---
  "Unknown": { bg: "bg-gray-200", text: "text-gray-600" },
};

interface StatusBadgeProps {
  status: BookingStatus | string;
}

export function LeadsStatusBadge({ status }: StatusBadgeProps) {
  // Get the styling exactly matching the string, or fallback to Unknown
  const style = BOOKING_STATUS_STYLES[status] || BOOKING_STATUS_STYLES["Unknown"];

  // Display fix: If backend sends the "Singed Up" typo, we display "Signed Up" visually
  const displayStatus = status === "Singed Up" ? "Signed Up" : (status || "Unknown");

  return (
    <span
      className={`
        inline-block max-w-[150px] lg:max-w-none
        text-nowrap px-2 py-1.5 lg:px-3 lg:py-2 rounded-full 
        text-xs lg:text-base font-medium truncate 
        ${style.bg} ${style.text}
      `}
      title={displayStatus} // Good UX: shows full status on hover
    >
      {displayStatus}
    </span>
  );
}
