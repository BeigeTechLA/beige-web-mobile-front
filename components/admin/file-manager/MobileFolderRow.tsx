"use client";

import React, { useState } from "react";
import { ChevronDown, FolderOpen, LinkIcon, MoreVertical, Unlink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/landing/ui/button";

interface FolderEntry {
  id: string;
  title: string;
  fileCount?: number;
  category?: string;
  isLinked?: boolean;
  type?: string;
  lastOpened: string;
}

export const MobileFolderRow = ({ folder, handleOpenMenu }: { folder: FolderEntry, handleOpenMenu: (e: React.MouseEvent<any>, folderTitle?: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#171717] rounded-xl border border-white/5 overflow-hidden mb-3">
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full bg-white/5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} className="text-white/60" />
          </div>
          <div className="h-10 w-10 bg-white/5 flex items-center justify-center rounded-lg">
            <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/10" size={20} />
          </div>
          <span className="text-sm font-semibold text-white truncate max-w-[180px]">
            {folder.title}
          </span>
        </div>
        <Button
          className="h-10 w-10 rounded-full p-0 text-white transition-colors hover:bg-white/10 hover:text-white/90"
          onClick={(e) => {
            e.stopPropagation(); // Prevents the accordion from opening/closing
            handleOpenMenu(e, folder.title);
          }}
        >
          <MoreVertical size={20} />
        </Button>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              {
                folder?.category && (
                  <div>
                    <p className="text-white/40 text-xs mb-1">Category</p>
                    <p className="text-white font-medium">{folder.category}</p>
                  </div>
                )
              }
              {
                folder?.type && (
                  <div>
                    <p className="text-white/40 text-xs mb-1">Category</p>
                    <p className="text-white font-medium">{folder.type}</p>
                  </div>
                )
              }
              {
                folder?.fileCount && (
                  <div className="">
                    <p className="text-white/40 text-xs mb-1">Files</p>
                    <p className="text-white font-medium">{folder.fileCount.toString().padStart(2, '0')}</p>
                  </div>
                )
              }
              <div>
                <p className="text-white/40 text-xs mb-1">Last Updated</p>
                <p className="text-white font-medium">{folder.lastOpened}</p>
              </div>
              {
                folder?.isLinked && (
                  <div className="">
                    <p className="text-white/40 text-xs mb-1">Status</p>
                    {/* Status Badge */}
                    {folder.isLinked ? (
                      <p className=" w-fit px-2 py-1.5 rounded-full bg-[#D4FFE4] text-[#16A34A] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
                        <LinkIcon size={16} />
                        Linked
                      </p>
                    ) : (
                      <p className="w-fit px-2 py-1.5 rounded-full bg-[#FFF1F2] text-[#F43F5E] text-xs font-medium border border-[#6ce9a6]/20 flex items-center gap-1.5">
                        <Unlink size={16} />
                        Unlinked
                      </p>
                    )}
                  </div>
                )
              }

              {/* <div className="text-right flex flex-col items-end">
                <p className="text-white/40 text-xs mb-1">Action</p>
                <button className="text-[#E8D1AB] font-bold text-sm">
                  Details
                </button>
              </div> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
