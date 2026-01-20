import React, { useState, useRef } from 'react';
import { Folder, MoreVertical, Link as LinkIcon, FolderOpen, Unlink } from 'lucide-react';
import { Button } from '../ui/button';
import FileActionMenu from './FileActionMenu';

interface FolderCardProps {
  title: string;
  fileCount: number;
  category: string;
  isLinked?: boolean;
  lastOpened: string;
  userInitials: string;
  onOpenLinkModal: () => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  title,
  fileCount,
  category,
  isLinked = true,
  lastOpened,
  userInitials,
  onOpenLinkModal
}) => {
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      // Fallback
      setMenuAnchor({ x: rect.right - 10, y: rect.top - 20 });
    }
  };
  return (
    <div className="w-full max-w-[350px] bg-[#18181b] rounded-[24px] border border-white/5 shadow-xl" ref={cardRef}>

      {/* Top Section */}
      <div className=" p-3 lg:p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-3">
            <div className="mt-1">
              {/* Custom Folder Icon Color */}
              <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/20" size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight">{title}</h3>
              <p className="text-[#E8D1AB]/60 text-sm mt-1">{fileCount.toString().padStart(2, '0')} Files</p>
            </div>
          </div>
          <Button
            className="text-white/40 hover:text-white transition-colors"
            onClick={handleOpenMenu}
          >
            <MoreVertical size={20} />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-4 py-1.5 rounded-full bg-black/40 text-white text-xs font-medium border border-white/5">
            {category}
          </span>
          {isLinked ? (
            <span className="px-2 py-1.5 rounded-full bg-[#D4FFE4] text-[#16A34A] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
              <LinkIcon size={16} />
              Linked
            </span>
          ) : (
            <span className="px-2 py-1.5 rounded-full bg-[#FFF1F2] text-[#F43F5E] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
              <Unlink size={16} />
              Unlinked
            </span>
          )}
        </div>

      </div>


      {/* Bottom Section */}
      <div className="flex items-center border-t border-t-white/50 p-3 lg:p-5 gap-3">
        <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-[#000] text-base">
          {userInitials}
        </div>
        <span className="text-[#CDC5C5] text-sm">Opened {lastOpened}</span>
      </div>

      {/* Menu Overlay */}
      {menuAnchor && (
        <FileActionMenu
          isOpen={true}
          onClose={() => setMenuAnchor(null)}
          onOpenLinkModal={onOpenLinkModal}
          anchor={menuAnchor} // Pass coordinates
        />
      )}
    </div>
  );
};