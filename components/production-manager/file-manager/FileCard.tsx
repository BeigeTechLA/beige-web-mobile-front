import React, { useState, useRef } from 'react';
import { FileText, MoreVertical, Link as LinkIcon, FolderOpen, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FileCard = ({ file, onMenuTrigger }: { file: any, onMenuTrigger: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {

    return (
        <div className="w-full bg-[#111111] rounded-xl border border-white/30 shadow-xl overflow-hidden">
            <div className="p-5 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#F04438] p-1.5 rounded-md">
                            <FileText className="text-white" size={16} />
                        </div>
                        <span className="text-white font-medium text-sm truncate max-w-[180px]">{file.title}</span>
                    </div>
                    <Button variant="ghost" className="text-white hover:text-white/90 p-0 h-auto" onClick={onMenuTrigger}>
                        <MoreVertical size={24} />
                    </Button>
                </div>

                {/* File Preview Area */}
                <div className="aspect-23/18 bg-[#202020] rounded-md flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <FileText size={64} className="text-[#F04438] fill-[#F04438]/10" />
                            {/* <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mt-1">PDF</span> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center border-t border-white/50 p-5 gap-3">
                <div className="h-10 w-10 rounded-full bg-[#C8E1FF] flex items-center justify-center text-black text-sm font-bold">
                    {file.userInitials}
                </div>
                <span className="text-[#CDC5C5] text-sm">Opened {file.lastOpened}</span>
            </div>
        </div>
    );
};
