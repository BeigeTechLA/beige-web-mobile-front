"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, Trash2, File } from "lucide-react";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderName: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, folderName }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectionError, setSelectionError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setSelectionError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleFiles = (files: FileList | null) => {
        if (files) {
            setSelectionError(null);
            const incoming = Array.from(files);
            const validIncoming = incoming.filter((file) => file.size > 0);
            const emptyFileCount = incoming.length - validIncoming.length;

            if (emptyFileCount > 0) {
                setSelectionError("You cannot upload empty files.");
            }

            setSelectedFiles((prev) => [...prev, ...validIncoming]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            {/* Modal Container */}
            <div className="mx-5 w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">

                {/* Header */}
                <div className="relative p-3 lg:p-5">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-hover hover:bg-white/20"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-lg font-semibold text-white">Upload Files</h2>
                    <p className="mt-1 text-sm text-white/60">
                        Files will be uploaded to the folder <span className="text-white/80">{folderName}</span>
                    </p>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full bg-white/10" />

                {/* Dropzone Area */}
                <div className="p-3 lg:p-5">
                    <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative flex h-[185px] cursor-pointer flex-col items-center justify-center rounded-[10px] border transition-all duration-200 
              ${isDragging
                                ? "border-[#E8D1AB] bg-[#E8D1AB]/5"
                                : "border-white/10 bg-[#202020] hover:border-white/20 hover:bg-[#202020]/[0.04]"
                            }`}
                    >
                        <input type="file" className="hidden" ref={fileInputRef} multiple onChange={(e) => handleFiles(e.target.files)} />

                        <div className="mb-4 flex h-16 w-16 items-center justify-center">
                            <UploadCloud className="text-[#E8D1AB]" size={32} />
                        </div>

                        <p className="text-lg font-medium text-white">
                            Drag your files here or{" "}
                            <span className="text-[#E8D1AB] underline decoration-[#E8D1AB]/30 underline-offset-4 hover:decoration-[#E8D1AB]">
                                Browse
                            </span>
                        </p>
                        {selectionError && (
                            <p className="mt-2 text-sm font-medium text-red-500">
                                {selectionError}
                            </p>
                        )}
                    </div>

                    {/* New: File List Area */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                            {selectedFiles.map((file, index) => (
                                <div
                                    key={`${file.name}-${index}`}
                                    className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/5"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <File size={18} className="text-[#E8D1AB] shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                            <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 p-3 pt-0 lg:p-5 lg:pt-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 lg:flex-none lg:min-w-[90px]"
                    >
                        Cancel
                    </button>
                    <button
                        className="flex-1 rounded-lg bg-[#E8D1AB] px-4 py-2 text-sm font-medium text-[#101010] transition-opacity hover:opacity-90 lg:flex-none lg:min-w-[110px]"
                    >
                        Upload File
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
