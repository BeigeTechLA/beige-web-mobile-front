import React from 'react';
import {
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  MoreVertical,
  Presentation
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const getFileExtension = (title?: string) => {
  const parts = (title || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const getFileMeta = (contentType?: string, title?: string) => {
  const extension = getFileExtension(title);

  if (contentType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(extension)) {
    return { icon: FileImage, label: "image", accentClass: "text-[#22C55E]", badgeClass: "bg-[#22C55E]/15" };
  }

  if (contentType?.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
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

export const AffiliateFileCard = ({ file, onMenuTrigger }: { file: any, onMenuTrigger: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {
    const meta = getFileMeta(file.contentType, file.title);
    const FileIcon = meta.icon;

    return (
        <div className="w-full bg-[#111111] rounded-xl border border-white/30 shadow-xl overflow-hidden">
            <div className="p-5 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`${meta.badgeClass} p-1.5 rounded-md`}>
                            <FileIcon className={meta.accentClass} size={16} />
                        </div>
                        <span className="text-white font-medium text-sm truncate max-w-[180px]">{file.title}</span>
                    </div>
                    <Button variant="ghost" className="text-white hover:text-white/90 p-0 h-auto" onClick={onMenuTrigger}>
                        <MoreVertical size={24} />
                    </Button>
                </div>

                <div className="aspect-23/18 bg-[#202020] rounded-md flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${meta.badgeClass}`}>
                            <FileIcon size={34} className={meta.accentClass} />
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white/70">{meta.label}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center border-t border-white/50 p-5 gap-3">
                <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-black text-sm font-bold">
                    {file.userInitials}
                </div>
                <span className="text-[#CDC5C5] text-sm">Opened {file.lastOpened}</span>
            </div>
        </div>
    );
};
