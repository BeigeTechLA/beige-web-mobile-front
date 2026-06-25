import React from 'react';
import {
  Check,
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Share2,
  MoreVertical,
  Play,
  Presentation,
  RotateCcw,
  Trash2,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const isImageFile = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);
  if (extension) {
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension);
  }
  if (contentType?.startsWith("image/")) return true;
  return false;
};

const isVideoFile = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);
  if (extension) {
    return ["mp4", "mov", "avi", "mkv", "webm"].includes(extension);
  }
  if (contentType?.startsWith("video/")) return true;
  return false;
};

const getFileExtension = (title?: string) => {
  const parts = (title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

// Updated metadata mapping function to handle dynamic theme accents correctly
const getFileMeta = (contentType?: string, title?: string, isDark: boolean = true) => {
  const extension = getFileExtension(title);

  if (isImageFile(contentType, title)) {
    return { icon: FileImage, label: "image", accentClass: "text-[#22C55E]", badgeClass: "bg-[#22C55E]/15" };
  }

  if (isVideoFile(contentType, title)) {
    return { icon: FileVideo, label: "video", accentClass: "text-[#E8D1AB]", badgeClass: "bg-[#E8D1AB]/15" };
  }

  if (contentType === "application/pdf" || extension === "pdf") {
    return { icon: FileText, label: "pdf", accentClass: "text-[#F04438]", badgeClass: "bg-[#F04438]/15" };
  }

  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return { icon: FileText, label: extension || "doc", accentClass: "text-[#3B82F6]", badgeClass: "bg-[#3B82F6]/15" };
  }

  if (["ppt", "pptx", "key"].includes(extension)) {
    return { icon: Presentation, label: extension || "ppt", accentClass: "text-[#F97316]", badgeClass: "bg-[#F97316]/15" };
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return { icon: FileSpreadsheet, label: extension || "sheet", accentClass: "text-[#10B981]", badgeClass: "bg-[#10B981]/15" };
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return { icon: FileArchive, label: extension || "zip", accentClass: "text-[#A855F7]", badgeClass: "bg-[#A855F7]/15" };
  }

  return {
    icon: FileText,
    label: extension || "file",
    accentClass: isDark ? "text-white/80" : "text-[#333333]",
    badgeClass: isDark ? "bg-white/10" : "bg-black/5"
  };
};

interface FileCardFile {
  id?: string;
  title?: string;
  contentType?: string;
  previewUrl?: string;
  userInitials?: string;
  uploaderName?: string;
  lastOpened?: string;
  statusLabel?: string;
  statusClassName?: string;
  versionLabel?: string;
  versionClassName?: string;
  fileSizeBytes?: number;
  size?: number;
}

const formatFileSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null || bytes === 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const FileCard = ({
  file,
  stage = "post-production",
  onMenuTrigger,
  onOpen,
  onDownload,
  onDelete,
  onShare,
  onUploadEdited,
  onApprove,
  onRequestRevision,
  isSelected,
  onSelect,
  isDark = true
}: {
  file: FileCardFile,
  onMenuTrigger?: (e: React.MouseEvent<HTMLButtonElement>) => void,
  onOpen?: () => void
  onDownload?: () => void,
  onDelete?: () => void,
  onShare?: () => void,
  onUploadEdited?: () => void,
  onApprove?: () => void,
  onRequestRevision?: () => void,
  isSelected?: boolean,
  onSelect?: (selected: boolean) => void,
  isDark?: boolean,
  stage?: 'pre-production' | 'post-production'
}) => {
  const meta = getFileMeta(file.contentType, file.title);
  const FileIcon = meta.icon;

  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const sizeInBytes = file.fileSizeBytes || file.size;
  const formattedSize = formatFileSize(sizeInBytes);

  // Selected State Highlights
  const activeBorder = isDark ? "border-[#E5D5B8] ring-1 ring-[#E5D5B8]/50" : "border-[#E8D1AB] ring-1 ring-[#E8D1AB]/50";
  const inactiveBorder = isDark ? "border-white/20 hover:border-white/40" : "border-[#E5E5E5] hover:border-zinc-300";

  return (
    <div
      className={`group w-full h-full cursor-pointer rounded-xl border shadow-md overflow-hidden relative transition-all flex flex-col ${isDark ? 'bg-[#111111]' : 'bg-white'} ${isSelected ? activeBorder : inactiveBorder}`}
      onClick={onOpen}
    >
      {/* Top row with Checkbox, ID, and File Size */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {onSelect && (
            <div
              className={`transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(!!checked)}
                className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-4 w-4"
              />
            </div>
          )}
          <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-white/60' : 'text-zinc-500'}`}>
            ID: #{file.id ? String(file.id).slice(-5) : "12345"}
          </span>
        </div>
        {formattedSize && (
          <span className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-zinc-500'}`}>
            {formattedSize}
          </span>
        )}
      </div>

      {/* Media Preview Area */}
      <div className="px-5">
        <div className={`aspect-23/18 rounded-lg flex items-center justify-center overflow-hidden ${isDark ? 'bg-[#202020]' : 'bg-[#F9F9F9] border border-[#EEEEEE]'}`}>
          {file.previewUrl && isImageFile(file.contentType, file.title) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.previewUrl} alt={file.title} className="h-full w-full object-cover" />
          ) : file.previewUrl && isVideoFile(file.contentType, file.title) ? (
            <div className="relative h-full w-full">
              <video
                src={file.previewUrl}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                  <Play size={16} className="ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.badgeClass}`}>
                <FileIcon size={24} className={meta.accentClass} />
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'border-white/10 text-white/70' : 'border-black/5 text-[#666666]'}`}>
                {meta.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`font-semibold text-sm truncate max-w-[70%] ${isDark ? 'text-white' : 'text-black'}`} title={file.title}>
              {file.title}
            </span>
            {stage === 'post-production' && file.statusLabel && (
              <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${file.versionClassName || "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                {file.versionLabel || (file.statusLabel.includes("Version") ? file.statusLabel.split(" ")[0] + " Latest" : "V1 Latest")}
              </span>
            )}
          </div>
          {stage === 'post-production' && (
            <div>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium leading-none ${
                file.statusClassName || 
                (isDark ? "border-[#3B82F6]/30 bg-[#3B82F6]/15 text-[#93C5FD]" : "border-blue-200 bg-blue-50 text-blue-600")
              }`}>
                {file.statusLabel || "Raw Files Uploaded"}
              </span>
            </div>
          )}
        </div>

        {/* Footer Area with Initials, Uploader, Date and Menu */}
        <div className={`pt-4 flex items-center justify-between border-t ${isDark ? 'border-white/10' : 'border-[#F0F0F0]'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#C8E1FF] flex items-center justify-center text-black text-xs font-bold shrink-0">
              {file.userInitials || "FM"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-xs font-medium truncate ${isDark ? 'text-[#CDC5C5]' : 'text-[#333333]'}`}>
                Uploaded by {file.uploaderName || "Unknown uploader"}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-[#CDC5C5]/60' : 'text-[#666666]/60'}`}>
                {file.lastOpened || "just now"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onMenuTrigger ? (
              <Button
                variant="ghost"
                className={`p-0 h-auto ${isDark ? 'text-white/90 hover:text-white' : 'text-[#333333] hover:text-black'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuTrigger(e);
                }}
              >
                <MoreVertical size={24} />
              </Button>
            ) : (!onMenuTrigger && (onDownload || onDelete || onShare || onUploadEdited || onApprove || onRequestRevision)) ? (
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  className={`p-0 h-auto ${isDark ? 'text-white/90 hover:text-white' : 'text-[#333333] hover:text-black'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                >
                  <MoreVertical size={24} />
                </Button>
                {menuOpen && (
                  <div className={`absolute bottom-full right-0 mb-2 w-48 rounded-xl border shadow-2xl z-[50] overflow-hidden ${isDark ? 'bg-[#171717] border-white/10 text-white' : 'bg-white border-zinc-200 text-black'}`}>
                    {onDownload && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDownload(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    )}
                    {onShare && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onShare(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors"
                      >
                        <Share2 size={16} />
                        Share
                      </button>
                    )}
                    {onUploadEdited && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onUploadEdited(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors"
                      >
                        <Upload size={16} />
                        Upload Edited
                      </button>
                    )}
                    {onApprove && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onApprove(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-[#22C55E]"
                      >
                        <Check size={16} />
                        Approve
                      </button>
                    )}
                    {onRequestRevision && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRequestRevision(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-[#E8D1AB]"
                      >
                        <RotateCcw size={16} />
                        Request Revision
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors text-[#F04438]"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
