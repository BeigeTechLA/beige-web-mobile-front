import React, { useState } from "react";
import { ChevronDown, Download, Share2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

{/* Internal Expandable Mobile Row Item */ }
export const MobileFileRow = ({
  file,
  isDark,
  isSelectionMode,
  isSelected,
  onSelect,
  onOpen,
  onDownload,
  onShare,
  onDelete,
  isDeleting
}: {
  file: any;
  isDark: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDownload: (e: any) => void;
  onShare: (e: any) => void;
  onDelete: (e: any) => void;
  isDeleting: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`transition-all duration-300 border-b last:border-0 ${isDark
        ? (isExpanded ? "bg-[#202020] border-white/5" : "bg-[#171717] border-white/5")
        : (isExpanded ? "bg-[#F9F9F9] border-black/5" : "bg-white border-black/5")
      }`}>
      {/* Header View — Always Visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer gap-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular Chevron Toggle */}
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
              ? (isDark ? 'rotate-180 border-[#E8D1AB] text-[#E8D1AB]' : 'rotate-180 border-[#000000] text-[#000000]')
              : (isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#999]')
            }`}>
            <ChevronDown size={14} />
          </div>

          {/* Selection Checkbox */}
          {isSelectionMode && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className={`h-5 w-5 border-medium transition-colors data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black ${isDark? "border-white/50": "border-black/40"}`}
              />
            </div>
          )}

          {/* Only File Title/Name Display */}
          <span className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-black"}`}>
            {file.title}
          </span>
        </div>
      </div>

      {/* Expandable Secondary Metadata & Actions Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`transition-colors duration-300 ${isDark ? "bg-[#202020]" : "border-[#E5E5E5] bg-[#F9F9F9]"}`}
          >
            <div className="pt-1 px-4 pb-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <p className={`mb-0.5 ${isDark ? "text-white/40" : "text-[#999]"}`}>Type</p>
                  <p className={`font-medium capitalize ${isDark ? "text-white/80" : "text-[#333]"}`}>{file.label}</p>
                </div>
                <div className="text-right">
                  <p className={`mb-0.5 ${isDark ? "text-white/40" : "text-[#999]"}`}>Last Opened</p>
                  <p className={`font-medium italic ${isDark ? "text-white/80" : "text-[#333]"}`}>{file.lastOpened}</p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className={`flex items-center justify-between pt-2 border-t ${isDark ? "border-white/5" : "border-black/5"}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  className={`font-medium underline underline-offset-4 ${isDark ? "text-[#E8D1AB]" : "text-[#B38F43]"}`}
                >
                  Open File
                </button>

                <div className={`flex items-center gap-1.5 ${isDark ? "text-white/60" : "text-black/60"}`}>
                  <button
                    className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"}`}
                    onClick={onDownload}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/60 hover:text-[#E8D1AB]" : "hover:bg-black/5 text-black/40 hover:text-[#B38F43]"}`}
                    onClick={onShare}
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white/60 hover:text-[#F04438]" : "hover:bg-black/5 text-black/40 hover:text-[#F04438]"}`}
                    onClick={onDelete}
                  >
                    {isDeleting ? <span className="text-[10px] tracking-tighter">...</span> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};