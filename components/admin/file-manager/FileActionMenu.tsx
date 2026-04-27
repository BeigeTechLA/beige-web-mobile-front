"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FolderOpen,
  Download,
  Trash2
} from "lucide-react";

interface FileActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLinkModal: () => void; // Prop to trigger the second modal
  anchor: { x: number; y: number }; // Add this
  folderName: string | number | null;
  href?: string;
  onOpen?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}

const FileActionMenu: React.FC<FileActionMenuProps> = ({
  isOpen, onClose, anchor, folderName, href, onOpen, onDownload, onDelete
}) => {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) return null;

  const handleOpenFolder = () => {
    if (onOpen) {
      onOpen();
      onClose();
      return;
    }
    const folder = folderName?.toString().trim().toLowerCase().split(" ").join("-")
    router.push(href || `${pathname}/${folder}`);
    onClose();
  };

  const handleBackdropClose = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <>
      {/* Invisible backdrop to close when clicking away */}
      <div
        className="fixed inset-0 z-40"
        onMouseDown={handleBackdropClose}
        onClick={handleBackdropClose}
      />

      {/* Menu Container */}
      <div
        className="fixed z-50 w-[220px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0A0A0A] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        style={{
          top: `${anchor.y}px`,
          left: `${anchor.x}px`
        }}
      >

        {/* Section 1: Navigation & Edit */}
        <div className="flex flex-col p-1.5">
          <MenuButton
            icon={<FolderOpen size={18} />}
            label="Open"
            onClick={handleOpenFolder}
          />
          {/* Temporarily hidden actions: Rename / Link to Shoot */}
          {/* <MenuButton icon={<Pencil size={18} />} label="Rename" onClick={() => {
            onRename?.();
            onClose();
          }} /> */}
          {/* <MenuButton
            icon={<LinkIcon size={18} />}
            label="Link to Shoot"
            onClick={() => {
              onOpenLinkModal();
              onClose();
            }}
          /> */}
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/10" />

        {/* Section 2: Sharing */}
        <div className="flex flex-col p-1.5">
          {/* Temporarily hidden action: Share */}
          {/* <MenuButton icon={<Share2 size={18} />} label="Share" onClick={onClose} /> */}
          <MenuButton icon={<Download size={18} />} label="Download" onClick={() => {
            onDownload?.();
            onClose();
          }} />
        </div>

        {onDelete ? (
          <>
            {/* Divider */}
            <div className="h-[1px] w-full bg-white/10" />

            {/* Section 3: Danger Zone */}
            <div className="flex flex-col p-1.5">
              <MenuButton
                icon={<Trash2 size={18} />}
                label="Delete"
                variant="danger"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              />
            </div>
          </>
        ) : null}
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

export default FileActionMenu;
