import React, { useState } from "react";
import { ChevronDown, ExternalLink, FolderOpen, Link2, UserRoundPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Workspace {
  externalId: string;
  title: string;
  fileCount: number | string;
  category: string;
  lastOpened: string;
}

interface MobileWorkspaceRowProps {
  workspace: Workspace;
  isDark: boolean;
  openWorkspace: (workspace: Workspace) => void;
  onAccess?: (workspace: Workspace) => void;
  formatRelativeTime: (time?: string) => string;
}

export const MobileWorkspaceRow = ({
  workspace,
  isDark,
  openWorkspace,
  onAccess,
  formatRelativeTime,
}: MobileWorkspaceRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`w-full rounded-xl border overflow-hidden mb-3 text-left transition-all duration-300 ${isDark
        ? isExpanded ? "bg-[#202020] border-white/10" : "bg-[#202020] border-white/5"
        : isExpanded ? "bg-[#F9F9F9] border-black/10" : "bg-white border-black/5"
      }`}>

      {/* Header View — Toggles Expansion State */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer gap-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Circular Chevron Toggle Indicator */}
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
              ? isDark ? "rotate-180 border-[#E8D1AB] text-[#E8D1AB]" : "rotate-180 border-black text-black"
              : isDark ? "border-white/10 text-white/60" : "border-[#E5E5E5] text-[#999]"
            }`}>
            <ChevronDown size={14} />
          </div>

          {/* Directory Folder Icon and Summary Info Container */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 flex items-center justify-center rounded-lg shrink-0 ${isDark ? "bg-white/5" : "bg-black/5"
              }`}>
              <FolderOpen className="text-[#E8D1AB] fill-[#E8D1AB]/10" size={20} />
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-semibold truncate max-w-[180px] ${isDark ? "text-white" : "text-black"
                }`}>
                {workspace.title}
              </div>
              <div className={`text-xs mt-1 ${isDark ? "text-white/40" : "text-black/40"
                }`}>
                {String(workspace.fileCount).padStart(2, "0")} Files
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onAccess ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAccess(workspace);
              }}
              className={`p-2 rounded-lg transition-colors ${isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5"
                }`}
              title="Manage access"
            >
              <UserRoundPlus size={18} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openWorkspace(workspace);
            }}
            className={`p-2 rounded-lg transition-colors ${isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5"
              }`}
          >
            <ExternalLink size={18} />
          </button>
        </div>
      </div>

      {/* Expandable Secondary Metadata Panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.23, ease: "easeInOut" }}
            className={`border-t text-sm transition-colors duration-300 ${isDark ? "border-white/5 bg-black/20" : "border-black/5 bg-white/20"
              }`}
          >
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>Category</p>
                <p className={`font-medium mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>{workspace.category}</p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>Last Updated</p>
                <p className={`font-medium mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>
                  Updated {formatRelativeTime(workspace.lastOpened)}
                </p>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors ${isDark
                  ? "bg-[#D1FAE5] text-[#065F46]"
                  : "bg-[#E6FBF0] text-[#15803D]"
                  }`}>
                  <Link2 size={11} className="shrink-0" />
                  Linked
                </span>
              </div>

              <div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors ${isDark
                  ? "bg-white/5 text-[#E8D1AB] border border-[#E8D1AB]/20"
                  : "bg-[#FDF8EE] text-[#B38F43] border border-[#B38F43]/20"
                  }`}>
                  View Only
                </span>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
