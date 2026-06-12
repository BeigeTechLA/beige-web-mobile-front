"use client";

import React, { useState } from "react";
import { CalendarX, ChevronDown, FolderOpen, LinkIcon, MoreVertical, Unlink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/landing/ui/button";

interface FolderEntry {
  id: string;
  title: string;
  fileCount?: number;
  category?: string;
  isLinked?: boolean;
  visibilityExpired?: boolean;
  type?: string;
  lastOpened: string;
}

export const MobileFolderRow = ({
  folder,
  handleOpenMenu,
  isDark = true
}: {
  folder: FolderEntry;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, folderTitle?: string) => void;
  isDark?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`rounded-xl border overflow-hidden mb-3 transition-colors duration-200 ${isDark
        ? "bg-[#171717] border-white/5"
        : "bg-white border-[#D7D7D7] shadow-sm"
      }`}>
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full transition-transform ${isDark ? "bg-white/5" : "bg-black/5"} ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} className={isDark ? "text-white/60" : "text-black/60"} />
          </div>
          <div className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors ${isDark ? "bg-white/5" : "bg-[#F4F5F7]"
            }`}>
            <FolderOpen
              className={"text-[#E8D1AB] fill-[#E8D1AB]/10"}
              size={20}
            />
          </div>
          <span className={`text-sm font-semibold truncate max-w-[180px] transition-colors ${isDark ? "text-white" : "text-black"
            }`} title={folder.title}>
            {folder.title}
          </span>
        </div>
        <Button
          className={`h-10 w-10 rounded-full p-0 transition-colors ${isDark
              ? "text-white hover:bg-white/10 hover:text-white/90"
              : "text-black hover:bg-black/5 hover:text-black/90"
            }`}
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
            className={`border-t transition-colors duration-200 ${isDark ? "border-white/5 bg-black/20" : "border-[#D7D7D7] bg-[#FAFAFA]"}`}
          >
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              {
                folder?.category && (
                  <div>
                    <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-[#727272]"}`}>Category</p>
                    <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{folder.category}</p>
                  </div>
                )
              }
              {
                folder?.type && (
                  <div>
                    <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-[#727272]"}`}>Category</p>
                    <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{folder.type}</p>
                  </div>
                )
              }
              {
                folder?.fileCount && (
                  <div className="">
                    <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-[#727272]"}`}>Files</p>
                    <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
                      {folder.fileCount.toString().padStart(2, '0')}
                    </p>
                  </div>
                )
              }
              <div>
                <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-[#727272]"}`}>Last Updated</p>
                <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{folder.lastOpened}</p>
              </div>
              {
                (folder?.isLinked || folder?.visibilityExpired) && (
                  <div className="">
                    <p className={`text-xs mb-1 ${isDark ? "text-white/40" : "text-[#727272]"}`}>Status</p>
                    {/* Status Badge */}
                    {folder.visibilityExpired ? (
                      <p className={`w-fit px-2 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${isDark
                          ? "bg-amber-500/15 text-amber-200 border border-amber-400/20"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                        <CalendarX size={16} />
                        Visibility expired
                      </p>
                    ) : folder.isLinked ? (
                      <p className={`w-fit px-2 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${isDark
                          ? "bg-[#D4FFE4] text-[#16A34A] border border-[#6ce9a6]/20"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
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
