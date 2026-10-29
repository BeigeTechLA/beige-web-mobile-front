"use client";

import { CheckSquare, Download, MoveRight, Trash2, X } from "lucide-react";

type Props = {
  selectedCount: number;
  folderCount: number;
  isDark: boolean;
  canDelete: boolean;
  canMove: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onMove: () => void;
  onDownload: () => void;
  onDelete: () => void;
};

export default function FileSelectionToolbar({
  selectedCount, folderCount, isDark, canDelete, canMove,
  onSelectAll, onClear, onMove, onDownload, onDelete,
}: Props) {
  const allSelected = folderCount > 0 && selectedCount >= folderCount;
  const buttonBase = "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-[min(96vw,1000px)] -translate-x-1/2 px-2 sm:bottom-6">
      <div className={`rounded-2xl border p-3 shadow-2xl sm:p-4 ${isDark ? "border-[#E8D1AB]/45 bg-[#1b1b1d] text-white" : "border-[#D5BE96] bg-white text-black"}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[#E8D1AB] px-2 text-sm font-semibold text-black">
              {selectedCount.toLocaleString()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{selectedCount === 1 ? "File selected" : "Files selected"}</p>
              <p className={`text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                {allSelected ? `All ${folderCount.toLocaleString()} files in this folder` : `${folderCount.toLocaleString()} files in this folder`}
              </p>
            </div>
            <button type="button" onClick={onClear} aria-label="Clear selection" className={`ml-auto rounded-md p-2 md:hidden ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <button type="button" onClick={onSelectAll} disabled={allSelected || !folderCount}
              className={`${buttonBase} ${isDark ? "text-white/80 hover:bg-white/10" : "text-black/75 hover:bg-black/5"}`}>
              <CheckSquare size={17} /> Select all {folderCount.toLocaleString()}
            </button>
            {canMove && (
              <button type="button" onClick={onMove} disabled={!selectedCount}
                className={`${buttonBase} bg-[#E8D1AB] text-black hover:bg-[#d8bf98]`}>
                <MoveRight size={17} /> Move
              </button>
            )}
            <button type="button" onClick={onDownload} disabled={!selectedCount || selectedCount > 100}
              title={selectedCount > 100 ? "Download supports up to 100 selected files at a time" : "Download selected files"}
              className={`${buttonBase} ${isDark ? "border border-white/15 bg-white/10 text-white hover:bg-white/15" : "border border-black/10 bg-black/5 text-black hover:bg-black/10"}`}>
              <Download size={17} /> Download
            </button>
            <button type="button" onClick={onDelete} disabled={!selectedCount || !canDelete}
              className={`${buttonBase} bg-[#F04438] text-white hover:bg-[#d7372d]`}>
              <Trash2 size={17} /> Delete
            </button>
            <button type="button" onClick={onClear} aria-label="Clear selection" className={`hidden rounded-md p-2 md:inline-flex ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
