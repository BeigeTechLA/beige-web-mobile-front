"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CalendarClock,
  FolderOpen,
  Share2,
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
  onShare?: () => void;
  onEditVisibility?: () => void;
  downloadDisabled?: boolean;
  deleteDisabled?: boolean;
  shareDisabled?: boolean;
  editVisibilityDisabled?: boolean;
  isDark?: boolean;
}

const FileActionMenu: React.FC<FileActionMenuProps> = ({
  isOpen,
  onClose,
  anchor,
  folderName,
  href,
  onOpen,
  onDownload,
  onDelete,
  onShare,
  onEditVisibility,
  downloadDisabled = false,
  deleteDisabled = false,
  shareDisabled = false,
  editVisibilityDisabled = false,
  isDark = true
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
        className={`fixed z-50 w-[220px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0A0A0A] shadow-2xl transition-colors duration-200 ${isDark ? "bg-[#0A0A0A] border-white/10" : "bg-white border-[#D7D7D7]"}`}
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
            isDark={isDark}
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
          {(onEditVisibility || editVisibilityDisabled) ? (
            <MenuButton
              icon={<CalendarClock size={18} />}
              label="Visibility date"
              onClick={() => {
                if (editVisibilityDisabled) return;
                onEditVisibility();
                onClose();
              }}
              disabled={editVisibilityDisabled}
              isDark={isDark}
            />
          ) : null}
        </div>

        {/* Divider */}
        <div className={`h-[1px] w-full ${isDark ? "bg-white/10" : "bg-[#D7D7D7]"}`} />

        {/* Section 2: Sharing */}
        <div className="flex flex-col p-1.5">
          {(onShare || shareDisabled) ? (
            <MenuButton
              icon={<Share2 size={18} />}
              label="Share"
              onClick={() => {
                if (shareDisabled) return;
                onShare();
                onClose();
              }}
              disabled={shareDisabled}
              isDark={isDark}
            />
          ) : null}
          {(onDownload || downloadDisabled) ? (
            <MenuButton
              icon={<Download size={18} />}
              label="Download"
              onClick={() => {
                if (downloadDisabled) return;
                onDownload?.();
                onClose();
              }}
              disabled={downloadDisabled}
              isDark={isDark}
            />
          ) : null}
        </div>

        {/* Divider */}
        {(onDelete || deleteDisabled) ? (
          <>
            <div className={`h-[1px] w-full ${isDark ? "bg-white/10" : "bg-[#D7D7D7]"}`} />
            <div className="flex flex-col p-1.5">
              <MenuButton
                icon={<Trash2 size={18} />}
                label="Delete"
                variant="danger"
                onClick={() => {
                  if (deleteDisabled) return;
                  onDelete();
                  onClose();
                }}
                disabled={deleteDisabled}
                isDark={isDark}
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
  variant = "default",
  disabled = false,
  isDark = true
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  isDark?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[15px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40
      ${variant === "danger"
        ? "text-[#F04438] hover:bg-[#F04438]/10"
        : isDark
          ? "text-white hover:bg-white/5"
          : "text-black hover:bg-black/5"
      }
    `}
  >
    <span className={
      variant === "danger"
        ? "text-[#F04438]"
        : isDark
          ? "text-white/70"
          : "text-black/60"
    }>
      {icon}
    </span>
    {label}
  </button>
);

export default FileActionMenu;
