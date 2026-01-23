import React from "react";
import { FileText, Download } from "lucide-react";

export default function ProductionFilesTab({ type }: { type: string }) {
  return (
    <div className="border-2 border-dashed border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
      <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
        <FileText className="text-white/20" size={32} />
      </div>
      <h3 className="text-lg font-bold mb-2">No {type} Files</h3>
      <p className="text-white/40 text-sm max-w-xs">
        Once files are uploaded for this project, they will appear here for your review.
      </p>
    </div>
  );
}