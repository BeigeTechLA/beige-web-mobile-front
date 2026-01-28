"use client";

import React, { useState, useRef } from "react";
import { CloudUpload, X, Folder, FileText, Image as ImageIcon, Trash2 } from "lucide-react";

interface UploadedFile {
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
}

export default function AffiliatePreProductionTab() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) return;

        const newFile: UploadedFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: selectedFile.name,
            size: formatFileSize(selectedFile.size),
            type: selectedFile.type,
            url: URL.createObjectURL(selectedFile)
        };

        setFiles([newFile, ...files]);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    return (
        <div className="space-y-6" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Upload Section */}
            {selectedFile ? (
                <div className="flex items-center justify-between bg-[#111111] p-2 rounded-2xl border border-[#222222] h-[72px]">
                    <div className="flex-1 flex justify-start px-4">
                        <div className="bg-[#1A1A1A] rounded-full pl-2 pr-4 py-2 flex items-center gap-3 min-w-[300px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedFile.type.startsWith('image/') ? 'bg-[#10B981]' : 'bg-[#2563EB]'}`}>
                                {selectedFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-white" /> : <span className="text-white text-[8px] font-bold">DOC</span>}
                            </div>

                            <div className="flex flex-col flex-1">
                                <span className="text-white text-sm font-medium leading-none truncate max-w-[200px]">{selectedFile.name}</span>
                                <span className="text-[#666666] text-xs leading-none mt-1">{formatFileSize(selectedFile.size)}</span>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="text-[#666666] hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleUpload}
                        className="bg-white text-black px-6 h-full rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                    >
                        <CloudUpload size={20} />
                        <span className="text-base leading-none">Upload File</span>
                    </button>
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between bg-[#111111] p-2 rounded-2xl border border-[#222222] h-[72px] cursor-pointer hover:border-[#333] transition-colors">
                    <div className="px-6 text-[#666666] text-base font-medium">
                        Select a file or drag and drop
                    </div>
                    <button className="bg-white text-black px-6 h-full rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                        <CloudUpload size={20} />
                        <span className="text-base leading-none">Upload File</span>
                    </button>
                </div>
            )}

            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden min-h-[400px]">
                <div className="px-6 py-4 border-b border-[#222222] bg-[#161616] flex justify-between items-center">
                    <h3 className="text-[#E5D5B8] text-base font-medium leading-none">Uploaded Documents</h3>
                </div>

                {files.length > 0 ? (
                    <div className="p-6 flex gap-6 flex-wrap">
                        {files.map((file) => (
                            <div key={file.id} className="border border-[#222222] bg-[#0A0A0A] rounded-xl p-5 flex items-center gap-5 w-[420px] group relative">
                                {file.type.startsWith('image/') ? (
                                    <div className="w-12 h-14 bg-[#1A1A1A] rounded-lg overflow-hidden shrink-0">
                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-14 bg-[#2563EB] rounded-lg relative shrink-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-[10px] z-10">DOC</span>
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-[#0A0A0A] opacity-50 rounded-bl-lg" />
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-lg" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-base font-medium leading-tight mb-1 truncate" title={file.name}>{file.name}</h4>
                                    <div className="flex items-center gap-3">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-[#E5D5B8] text-sm underline underline-offset-4 hover:text-[#D4C3A3]">View File</a>
                                        <span className="text-[#666] text-xs leading-none">• {file.size}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeFile(file.id)}
                                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 text-[#666] hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[300px]">
                        <div className="mb-6 relative">
                            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="#E5D5B8" strokeWidth="1">
                                <path d="M10 30 L40 30 L50 40 L90 40 L90 80 L10 80 Z" fill="none" rx="4" />
                                <path d="M10 30 L10 25 Q10 20 15 20 L35 20 Q40 20 40 25 L40 30" fill="none" />
                                <path d="M25 10 L65 10 L60 30 L20 30 Z" fill="#1A1A1A" stroke="#E5D5B8" strokeWidth="1" transform="rotate(-15 45 20)" />
                                <circle cx="65" cy="55" r="18" fill="#1A1A1A" stroke="#E5D5B8" strokeWidth="1" />
                                <line x1="78" y1="68" x2="90" y2="80" stroke="#E5D5B8" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className="text-white text-xl font-medium mb-2">No File Uploaded</h3>
                        <p className="text-[#666666] text-sm">No files have been uploaded for this project yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
