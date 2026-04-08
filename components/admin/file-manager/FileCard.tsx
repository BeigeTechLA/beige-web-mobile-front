import React from 'react';
import { Download, FileText, MoreVertical, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const isImageFile = (contentType?: string, title?: string) => {
  if (contentType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(title || "");
};

const isVideoFile = (contentType?: string, title?: string) => {
  if (contentType?.startsWith("video/")) return true;
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(title || "");
};

export const FileCard = ({
  file,
  onMenuTrigger,
  onOpen,
  onDownload,
  onDelete,
}: {
  file: any,
  onMenuTrigger?: (e: React.MouseEvent<HTMLButtonElement>) => void,
  onOpen?: () => void
  onDownload?: () => void,
  onDelete?: () => void
}) => {

  return (
    <div
      className="group w-full cursor-pointer bg-[#111111] rounded-xl border border-white/30 shadow-xl overflow-hidden"
      onClick={onOpen}
    >
      <div className="p-5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#F04438] p-1.5 rounded-md">
              <FileText className="text-white" size={16} />
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
              <div className="relative">
                <FileText size={64} className="text-[#F04438] fill-[#F04438]/10" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-white/50 p-5 gap-3">
        <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-black text-sm font-bold">
          {file.userInitials}
        </div>
        <span className="text-[#CDC5C5] text-sm">Updated {file.lastOpened}</span>
      </div>
    </div>
  );
};
