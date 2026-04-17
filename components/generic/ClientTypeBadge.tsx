"use client";

import { cn } from "@/lib/utils";

type ClientTypeBadgeProps = {
  clientType?: string | number | null;
  userId?: string | number | null;
  isDark?: boolean;
  isSelected?: boolean;
  className?: string;
};

const resolveClientType = (
  clientType?: string | number | null,
  userId?: string | number | null
) => {
  const normalizedType = String(clientType ?? "").trim().toLowerCase();

  if (normalizedType === "registered" || normalizedType === "guest") {
    return normalizedType;
  }

  return String(userId ?? "").trim() ? "registered" : "guest";
};

export function ClientTypeBadge({
  clientType,
  userId,
  isDark = true,
  isSelected = false,
  className,
}: ClientTypeBadgeProps) {
  const resolvedClientType = resolveClientType(clientType, userId);
  const isRegistered = resolvedClientType === "registered";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
        isSelected
          ? isRegistered
            ? "border-black/15 bg-black text-[#E8D1AB]"
            : "border-black/10 bg-black/10 text-black/70"
          : isDark
            ? isRegistered
              ? "border-[#2F5B45] bg-[#12211A] text-[#7ED7A2]"
              : "border-[#E8D1AB]/20 bg-[#1E1E1E] text-[#E8D1AB]"
            : isRegistered
              ? "border-[#B7E3C8] bg-[#E8F6EE] text-[#1F6B45]"
              : "border-[#E8D1AB]/50 bg-[#F7EBD8] text-[#7A5B2F]",
        className
      )}
    >
      {isRegistered ? "Registered" : "Guest"}
    </span>
  );
}
