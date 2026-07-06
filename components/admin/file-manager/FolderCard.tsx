import React, { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added imports
import { CalendarX, FolderOpen, MoreVertical, Link as LinkIcon, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FileActionMenu from './FileActionMenu';
import { useResolvedTheme } from '@/lib/useResolvedTheme';

const formatFolderTimestamp = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "recently";
  if (raw === "recently" || raw === "just now") return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  const datePart = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);

  return `${datePart}\n${timePart}`;
};

interface FolderCardProps {
  title: string;
  fileCount: number;
  category?: string;
  isLinked?: boolean;
  lastOpened: string;
  userInitials: string;
  onOpenLinkModal: () => void;
  href?: string;
  onOpen?: () => void;
  showMenu?: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onShare?: () => void;
  onEditVisibility?: () => void;
  downloadDisabled?: boolean;
  deleteDisabled?: boolean;
  shareDisabled?: boolean;
  editVisibilityDisabled?: boolean;
  visibilityExpired?: boolean;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  title,
  fileCount,
  category,
  isLinked,
  lastOpened,
  userInitials,
  onOpenLinkModal,
  href,
  onOpen,
  showMenu = true,
  onDownload,
  onDelete,
  onRename,
  onShare,
  onEditVisibility,
  downloadDisabled = false,
  deleteDisabled = false,
  shareDisabled = false,
  editVisibilityDisabled = false,
  visibilityExpired = false
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isDark } = useResolvedTheme();

  const handleOpenFolder = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    if (onOpen) {
      onOpen();
      return;
    }

    const folderSlug = title.toString().trim().toLowerCase().split(" ").join("-");
    router.push(href || `${pathname}/${folderSlug}`);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Stop click from triggering handleOpenFolder
    const rect = e.currentTarget.getBoundingClientRect();
    const container = cardRef.current?.parentElement;

    if (container) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = cardRef.current!.getBoundingClientRect();

      const isInLastCol = cardRect.right > containerRect.right - 20;
      const isInLastRow = cardRect.bottom > containerRect.bottom - 20;

      setMenuAnchor({
        x: isInLastCol ? rect.left - 210 : rect.right - 10,
        y: isInLastRow ? rect.top - 130 : rect.top - 20
      });
    } else {
      setMenuAnchor({ x: rect.right - 10, y: rect.top - 20 });
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleOpenFolder}
      className={`w-full h-full lg:max-w-[350px] rounded-xl lg:rounded-3xl border cursor-pointer transition-all group flex flex-col overflow-hidden ${isDark
        ? "bg-[#18181b] border-white/5 shadow-xl hover:border-white/20 hover:bg-[#1c1c20]"
        : "bg-white border-[#e3e3e3] shadow-sm hover:border-[#D7D7D7] hover:shadow-md"
        }`}
    >
      {/* Top Section */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 items-start min-w-0">
            <div>
              <FolderOpen
                className={`text-[#E8D1AB] fill-[#E8D1AB]/20`}
                size={24}
              />
            </div>
            <div className="min-w-0">
              <h3
                className={`font-semibold text-sm leading-tight truncate transition-colors ${isDark ? "text-white" : "text-black"
                  }`}
                title={title}
              >
                {title}
              </h3>
              <p className={`text-sm mt-1 ${isDark ? "text-[#E8D1AB]/60" : "text-[#000000]"}`}>
                {fileCount.toString().padStart(2, '0')} Files
              </p>
            </div>
          </div>
          {showMenu ? (
            <Button
              className={`h-9 w-9 rounded-full p-0 transition-colors ${isDark
                ? "text-white hover:bg-white/10 hover:text-white/90"
                : "text-black bg-transparent hover:bg-black/5 hover:text-black/90"
                }`}
              onClick={handleOpenMenu}
            >
              <MoreVertical size={20} />
            </Button>
          ) : null}
        </div>

        {/* Badges */}
        {(category?.trim() || isLinked || visibilityExpired) && (
          <div className="mt-4 flex min-w-0 flex-nowrap items-center gap-2">
            {category?.trim() ? (
              <span className={`min-w-0 ${visibilityExpired ? "max-w-[140px]" : "max-w-[170px]"} shrink truncate rounded-full border px-4 py-1.5 text-xs font-medium ${isDark
                ? "border-white/5 bg-black/40 text-white"
                : "border-[#F0F0F0] bg-[#F0F0F0] text-[#929292]"
                }`}>
                {category}
              </span>
            ) : null}

            {visibilityExpired ? (
              <span className={`shrink-0 px-2 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap ${isDark
                ? "bg-amber-500/15 text-amber-200 border border-amber-400/20"
                : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                <CalendarX size={15} />
                Visibility expired
              </span>
            ) : isLinked ? (
              <span className={`shrink-0 px-2 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap bg-[#D4FFE4] text-[#16A34A] border border-[#6ce9a6]/20`}>
                <LinkIcon size={16} />
                Linked
              </span>
            ) : (
              <span className={`shrink-0 px-2 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${isDark
                ? "bg-[#FFF1F2] text-[#F43F5E] border border-rose-500/20"
                : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}>
                <Unlink size={16} />
                Unlinked
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className={`mt-auto flex items-center p-5 gap-3 border-t ${isDark ? "border-t-white/10" : "border-t-[#D7D7D7]"}`}>
        <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-[#000] text-base">
          {userInitials}
        </div>
        <span
            className={`text-sm whitespace-pre-line ${
              isDark ? "text-[#CDC5C5]" : "text-[#000000]"
            }`}
          >
            {`Updated on ${formatFolderTimestamp(lastOpened)}`}
          </span>
      </div>

      {/* Menu Overlay */}
      {showMenu && menuAnchor && (
          <FileActionMenu
            folderName={title}
            isOpen={true}
            onClose={() => setMenuAnchor(null)}
            onOpenLinkModal={onOpenLinkModal}
            anchor={menuAnchor}
            href={href}
            onOpen={onOpen}
            onDownload={onDownload}
            onShare={onShare}
            onDelete={onDelete}
            onRename={onRename}
            onEditVisibility={onEditVisibility}
            downloadDisabled={downloadDisabled}
            deleteDisabled={deleteDisabled}
            shareDisabled={shareDisabled}
            editVisibilityDisabled={editVisibilityDisabled}
            isDark={isDark}
          />
        )}
    </div>
  );
};
