"use client";

import React, { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderOpen,
  Trash2,
  TicketPercent,
} from "lucide-react";
import {
  useDeleteClientLeadMutation,
  useDeleteLeadMutation,
} from "@/lib/redux/features/sales/salesApi";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";
import PaymentTransactionModal from "@/components/admin/sales-representative/PaymentTransactionModal";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchor: { x: number; y: number };
  client: string | number | null;
  leadId: number | string;
  basePath?: string;
  onDeleteSuccess?: () => void;
  onManualPaymentSuccess?: () => void;
  allowPaymentTransaction?: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  onClose,
  anchor,
  client,
  leadId,
  basePath,
  onDeleteSuccess,
  onManualPaymentSuccess,
  allowPaymentTransaction = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLead, { isLoading: isDeletingLead }] = useDeleteLeadMutation();
  const [deleteClientLead, { isLoading: isDeletingClientLead }] =
    useDeleteClientLeadMutation();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { canDelete: canDeleteByPermission } = usePermissions("sales_representative");
  const numericLeadId = Number(leadId);
  const resolvedPath = basePath ? basePath : pathname;

  const itemType = useMemo(() => {
    if (resolvedPath.includes("/client")) return "client";
    if (resolvedPath.includes("creative-partner")) return "creative-partner";
    return "lead";
  }, [resolvedPath]);

  const canDelete = canDeleteByPermission && (itemType === "lead" || itemType === "client");
  const isDeleting = isDeletingLead || isDeletingClientLead;
  if (!isOpen) return null;

  const navigateToDetails = () => {
    const cleanPath = resolvedPath.endsWith("/")
      ? resolvedPath.slice(0, -1)
      : resolvedPath;

    router.push(`${cleanPath}/${numericLeadId}`);
    onClose();
  };

  const handleDelete = async () => {
    if (!canDeleteByPermission) return;
    if (!numericLeadId) {
      toast.error("Invalid lead id");
      return;
    }

    try {
      if (itemType === "client") {
        const response = await deleteClientLead(numericLeadId).unwrap();
        toast.success(response.message || "Client lead deleted successfully");
      } else {
        const response = await deleteLead(numericLeadId).unwrap();
        toast.success(response.message || "Sales lead deleted successfully");
      }

      setIsDeleteModalOpen(false);
      onClose();
      onDeleteSuccess?.();
    } catch (error: unknown) {
      console.error("Error deleting lead:", error);
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message === "string"
          ? (error as { data?: { message?: string } }).data?.message
          : "Failed to delete lead";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className={`fixed z-50 w-[220px] overflow-hidden rounded-[20px] border shadow-2xl transition-all duration-200 ${
          isDark 
          ? "border-white/10 bg-[#0A0A0A] shadow-black/50" 
          : "border-[#E5E5E5] bg-white shadow-xl"
        }`}
        style={{
          top: `${anchor.y}px`,
          left: `${anchor.x}px`,
        }}
      >
        <div className="flex flex-col p-1.5">
          <MenuButton
            icon={<FolderOpen size={18} />}
            label="View Details"
            onClick={navigateToDetails}
            isDark={isDark}
          />
          <MenuButton
            icon={<TicketPercent size={18} />}
            label="Generate Discount"
            onClick={navigateToDetails}
            isDark={isDark}
          />
          {(itemType === "lead" || itemType === "client") && allowPaymentTransaction && (
            <MenuButton
              icon={<TicketPercent size={18} />}
              label="Record Payment"
              onClick={() => setIsPaymentModalOpen(true)}
              isDark={isDark}
            />
          )}
        </div>

        <div className={`h-[1px] w-full ${isDark ? "bg-white/10" : "bg-[#F0F0F0]"}`} />
        <>
        {/* <div className="flex flex-col p-1.5">
        <MenuButton
          icon={<BookCheck size={18} />}
          label="Manage Quote"
          onClick={onClose}
        />
      </div> */}

      {/* Divider */}
          <div className={`h-[1px] w-full ${isDark ? "bg-white/10" : "bg-[#F0F0F0]"}`} />
          <div className="flex flex-col p-1.5">
            <MenuButton
              icon={<Trash2 size={18} />}
              label="Delete"
              variant="danger"
              disabled={!canDelete}
              onClick={() => setIsDeleteModalOpen(true)}
              isDark={isDark}
            />
          </div>
        </>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={itemType === "client" ? "Delete Client Lead" : "Delete Sales Lead"}
        description={`Are you sure you want to delete ${client ? String(client) : "this record"}? This action cannot be undone.`}
      />
      <PaymentTransactionModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        leadId={numericLeadId}
        isClientLead={itemType === "client"}
        isDark={isDark}
        onSaved={() => {
          setIsPaymentModalOpen(false);
          onClose();
          onManualPaymentSuccess?.();
        }}
      />
    </>
  );
};

/* Internal Helper Component for Buttons */
const MenuButton = ({
  icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
  isDark = true,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  isDark?: boolean;
}) => {
  const getColors = () => {
    if (variant === "danger") {
      return isDark 
        ? "text-[#F04438] hover:bg-[#F04438]/10" 
        : "text-[#D92D20] hover:bg-[#FEF3F2]";
    }
    return isDark 
      ? "text-white hover:bg-white/5" 
      : "text-[#171717] hover:bg-black/5";
  };

  const getIconColor = () => {
    if (variant === "danger") return isDark ? "text-[#F04438]" : "text-[#D92D20]";
    // Use the theme's accent color for standard icons in light mode
    return isDark ? "text-white/70" : "text-[#BFA780]";
  };

  return (
  <button
    onClick={onClick}
    disabled={disabled}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[14px] lg:text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getColors()}`}
  >
      <span className={getIconColor()}>
      {icon}
    </span>
    {label}
  </button>
);
};

export default ActionMenu;
