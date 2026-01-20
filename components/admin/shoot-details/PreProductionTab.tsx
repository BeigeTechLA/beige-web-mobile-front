"use client";

import React from "react";
import { CloudUpload, FileText } from "lucide-react";

export default function PreProductionTab() {
    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="flex items-center gap-4 bg-[#111111] p-2 rounded-2xl border border-[#222222]">
                <div className="flex-1 px-4 py-3 text-[#666666] text-sm flex items-center gap-2">
                    <span>Select a file or drag and drop</span>
                </div>
                <button className="bg-white text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                    <CloudUpload size={20} />
                    <span>Upload File</span>
                </button>
            </div>

            {/* Uploaded Documents */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
                <h3 className="text-white font-medium mb-6">Uploaded Documents</h3>

                <div className="flex gap-4">
                    {/* DOC Card */}
                    <div className="border border-[#222222] rounded-xl p-6 flex items-center gap-4 w-[400px]">
                        <div className="w-12 h-14 bg-[#1E40AF] rounded-lg flex items-center justify-center relative shrink-0">
                            <span className="text-white font-bold text-xs">DOC</span>
                            <div className="absolute top-0 right-0 w-4 h-4 bg-[#111111] rounded-bl-lg" />
                        </div>
                        <div>
                            <h4 className="text-[#E0E0E0] text-sm font-medium mb-1">Lorem Ipsum is simply dummy text</h4>
                            <a href="#" className="text-[#E5D5B8] text-xs underline underline-offset-2 hover:text-[#D4C3A3]">View Document</a>
                        </div>
                    </div>

                    {/* PDF Card */}
                    <div className="border border-[#222222] rounded-xl p-6 flex items-center gap-4 w-[400px]">
                        <div className="w-12 h-14 bg-[#DC2626] rounded-lg flex items-center justify-center relative shrink-0">
                            {/* Simple geometric icon for PDF */}
                            <FileText className="text-white w-6 h-6" />
                            <span className="absolute bottom-1 text-[8px] font-bold text-white">PDF</span>
                            <div className="absolute top-0 right-0 w-4 h-4 bg-[#111111] rounded-bl-lg" />
                        </div>
                        <div>
                            <h4 className="text-[#E0E0E0] text-sm font-medium mb-1">Lorem Ipsum is simply dummy text</h4>
                            <a href="#" className="text-[#E5D5B8] text-xs underline underline-offset-2 hover:text-[#D4C3A3]">View Document</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
