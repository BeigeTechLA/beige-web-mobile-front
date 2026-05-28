import React from 'react';
import {
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
  Trash2
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

const getFileMeta = (contentType?: string, title?: string) => {
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

  return { icon: FileText, label: extension || "file", accentClass: "text-white/80", badgeClass: "bg-white/10" };
};

export const FileCard = ({
  file,
  onMenuTrigger,
  onOpen,
  onDownload,
  onDelete,
  onShare,
  isSelected,
  onSelect,
}: {
  file: any,
  onMenuTrigger?: (e: React.MouseEvent<HTMLButtonElement>) => void,
  onOpen?: () => void
  onDownload?: () => void,
  onDelete?: () => void,
  onShare?: () => void,
  isSelected?: boolean,
  onSelect?: (selected: boolean) => void,
}) => {
  const meta = getFileMeta(file.contentType, file.title);
  const FileIcon = meta.icon;

  return (
    <div
      className={`group w-full h-full cursor-pointer bg-[#111111] rounded-xl border shadow-xl overflow-hidden relative transition-all flex flex-col ${
        isSelected ? 'border-[#E8D1AB] ring-1 ring-[#E8D1AB]/50' : 'border-white/30 hover:border-white/40'
      }`}
      onClick={onOpen}
    >
      {onSelect && (
        <div 
          className={`absolute top-3 left-3 z-10 transition-opacity ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(checked) => onSelect(!!checked)}
            className="border-white/50 data-[state=checked]:bg-[#E8D1AB] data-[state=checked]:border-[#E8D1AB] data-[state=checked]:text-black h-5 w-5"
          />
        </div>
      )}
      <div className="p-5 pt-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`${meta.badgeClass} p-1.5 rounded-md`}>
              <FileIcon className={meta.accentClass} size={16} />
            </div>
            <span className="text-white font-medium text-sm truncate max-w-[180px]">{file.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {onDownload ? (
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
              >
                <Download size={18} />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                className="text-white/60 hover:text-[#F04438] p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={18} />
              </Button>
            ) : null}
            {onShare ? (
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
              >
                <Share2 size={18} />
              </Button>
            ) : null}
            {onMenuTrigger ? (
              <Button
                variant="ghost"
                className="text-white hover:text-white/90 p-0 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuTrigger(e);
                }}
              >
                <MoreVertical size={24} />
              </Button>
            ) : null}
          </div>
        </div>

        {/* File Preview Area */}
        <div className="aspect-23/18 bg-[#202020] rounded-md flex items-center justify-center">
          {file.previewUrl && isImageFile(file.contentType, file.title) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.previewUrl} alt={file.title} className="h-full w-full object-cover rounded-md" />
          ) : file.previewUrl && isVideoFile(file.contentType, file.title) ? (
            <div className="relative h-full w-full">
              <video
                src={file.previewUrl}
                className="h-full w-full rounded-md object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                  <Play size={20} className="ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${meta.badgeClass}`}>
                <FileIcon size={34} className={meta.accentClass} />
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white/70">{meta.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center border-t border-white/50 p-5 gap-3">
        <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-black text-sm font-bold">
          {file.userInitials}
        </div>
        <span className="text-[#CDC5C5] text-sm">Updated {file.lastOpened}</span>
      </div>
    </div>
  );
};
