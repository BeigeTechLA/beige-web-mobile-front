"use client";

import React, { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchor: { x: number; y: number };
  leadId: number | string;
  basePath?: string;
  onViewDetails?: () => void;
  onReview?: () => void;
  onApprove?: () => void;
  onDecline?: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  onClose,
  anchor,
  leadId,
  basePath,
  onViewDetails,
  onReview,
  onApprove,
  onDecline,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  const numericLeadId = Number(leadId);
  const resolvedPath = basePath ? basePath : pathname;

  if (!isOpen) return null;

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      const cleanPath = resolvedPath.endsWith("/")
        ? resolvedPath.slice(0, -1)
        : resolvedPath;
      router.push(`${cleanPath}/${numericLeadId}`);
    }
    onClose();
  };

  const handleReviewDetails = () => {
    onReview?.();
    onClose();
  };

  const handleApprove = () => {
    onApprove?.();
    onClose();
  };

  const handleDecline = () => {
    onDecline?.();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover Menu Container */}
      <div
        className={`fixed z-50 w-[180px] overflow-hidden rounded-[16px] border transition-all duration-200 ${isDark
            ? "border-white/10 bg-[#161616] shadow-2xl shadow-black/80 text-[#D4D4D4]"
            : "border-gray-200 bg-white shadow-xl text-gray-800"
          }`}
        style={{
          top: `${anchor.y}px`,
          left: `${anchor.x}px`,
        }}
      >
        <div className="flex flex-col py-1.5 px-1 space-y-0.5">
          <MenuButton
            label="View Details"
            onClick={handleViewDetails}
            variant="default"
            isDark={isDark}
          />
          <MenuButton
            label="Review Agreement"
            onClick={handleReviewDetails}
            variant="default"
            isDark={isDark}
          />
          <MenuButton
            label="Approve"
            onClick={handleApprove}
            variant="success"
            isDark={isDark}
          />
          <MenuButton
            label="Decline"
            onClick={handleDecline}
            variant="danger"
            isDark={isDark}
          />
        </div>
      </div>
    </>
  );
};

/* Internal Helper Button Component */
const MenuButton = ({
  label,
  onClick,
  variant = "default",
  disabled = false,
  isDark = true,
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "success" | "danger";
  disabled?: boolean;
  isDark?: boolean;
}) => {
  const getColors = () => {
    if (variant === "success") {
      return isDark
        ? "text-[#34D399] hover:bg-[#34D399]/10"
        : "text-[#10B981] hover:bg-[#10B981]/10";
    }
    if (variant === "danger") {
      return isDark
        ? "text-[#F87171] hover:bg-[#F87171]/10"
        : "text-[#EF4444] hover:bg-[#EF4444]/10";
    }
    return isDark
      ? "text-[#D1D5DB] hover:bg-white/5"
      : "text-gray-700 hover:bg-black/5";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getColors()}`}
    >
      {label}
    </button>
  );
};

export default ActionMenu;