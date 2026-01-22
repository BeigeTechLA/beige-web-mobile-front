"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderOpen,
  Link as LinkIcon,
  Trash2,
  BookCheck,
  TicketPercent
} from "lucide-react";

interface ActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchor: { x: number; y: number }; // Add this
  client: string | number | null;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen, onClose, anchor, client
}) => {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) return null;

  const handleOpenFolder = () => {
    const folder = client?.toString().trim().toLowerCase().split(" ").join("-")
    router.push(`${pathname}/${folder}`);
    onClose();
  };

  return (
    <>
      {/* Invisible backdrop to close when clicking away */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu Container */}
      <div className="fixed z-50 w-[220px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0A0A0A] shadow-2xl"
        style={{
          top: `${anchor.y}px`,
          left: `${anchor.x}px`
        }}>

        {/* Section 1: Navigation & Edit */}
        <div className="flex flex-col p-1.5">
          <MenuButton
            icon={<FolderOpen size={18} />}
            label="View Details"
            onClick={handleOpenFolder}
          />
          <MenuButton icon={<TicketPercent size={18} />} label="Generate Discount" onClick={onClose} />
          <MenuButton
            icon={<LinkIcon size={18} />}
            label="Payment Link"
            onClick={onClose}
          />
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/10" />

        {/* Section 2: Sharing */}
        <div className="flex flex-col p-1.5">
          <MenuButton icon={<BookCheck size={18} />} label="Manage Quote" onClick={onClose} />
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/10" />

        {/* Section 3: Danger Zone */}
        <div className="flex flex-col p-1.5">
          <MenuButton
            icon={<Trash2 size={18} />}
            label="Delete"
            variant="danger"
            onClick={onClose}
          />
        </div>
      </div>
    </>
  );
};

/* Internal Helper Component for Buttons */
const MenuButton = ({
  icon,
  label,
  onClick,
  variant = "default"
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[15px] font-medium transition-colors
      ${variant === "danger"
        ? "text-[#F04438] hover:bg-[#F04438]/10"
        : "text-white hover:bg-white/5"
      }
    `}
  >
    <span className={variant === "danger" ? "text-[#F04438]" : "text-white/70"}>
      {icon}
    </span>
    {label}
  </button>
);

export default ActionMenu;