"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Folder, Loader2, FileText, ExternalLink } from "lucide-react";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import {
  fileManagerApi,
  mapExternalFilesToUi,
  mapExternalFoldersToUi,
} from "@/lib/fileManagerApi";

export default function SalesPreProductionTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadPreProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileManagerApi.getExternalWorkspaceFiles(projectId, "pre");
      setWorkspaceName(response.workspace.folderName);
      setFolders(
        mapExternalFoldersToUi(
          response.folders,
          (folder) =>
            `/sales/file-manager/${projectId}/pre-production/${folder.name.toLowerCase().replace(/\s+/g, "-")}`
        )
      );
      setFiles(mapExternalFilesToUi(response.files));
    } catch (err: any) {
      setError(err?.message || "Failed to load pre-production files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadPreProduction();
    }
  }, [projectId]);

  const hasContent = useMemo(() => folders.length > 0 || files.length > 0, [folders.length, files.length]);

  return (
    <div className="space-y-6" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <div className="flex items-center justify-between bg-[#111111] lg:p-2 rounded-lg lg:rounded-2xl border border-[#222222] min-h-[46px] lg:min-h-[72px]">
        <div className="px-6 text-[#666666] text-xs lg:text-base font-medium">
          {workspaceName ? `Live Pre Production for ${workspaceName}` : "Open and manage Pre Production files"}
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-white text-black px-6 h-full min-h-[46px] lg:min-h-[72px] rounded-r-lg lg:rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-200 transition-colors"
        >
          <CloudUpload size={20} />
          <span className="text-xs lg:text-base leading-none">Upload File</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[220px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/50" size={28} />
        </div>
      ) : error ? (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl min-h-[220px] flex items-center justify-center text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {folders.length > 0 && (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222] bg-[#161616]">
                <h3 className="text-[#E5D5B8] text-base font-medium leading-none">Folders</h3>
              </div>
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => router.push(folder.href)}
                    className="text-left flex items-center justify-between rounded-2xl border border-[#222222] bg-[#0A0A0A] px-5 py-4 hover:border-[#444] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="text-[#E5D5B8]" size={20} />
                      <div>
                        <div className="text-white font-medium">{folder.title}</div>
                        <div className="text-xs text-[#888]">{folder.fileCount} files</div>
                      </div>
                    </div>
                    <ExternalLink className="text-white/40" size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 || folders.length === 0 ? (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden min-h-[280px]">
              <div className="px-6 py-4 border-b border-[#222222] bg-[#161616] flex justify-between items-center">
                <h3 className="text-[#E5D5B8] text-base font-medium leading-none">Uploaded Documents</h3>
              </div>

              {files.length > 0 ? (
                <div className="p-3 lg:p-6 flex gap-6 flex-wrap">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => router.push(`/sales/file-manager/${projectId}/pre-production`)}
                      className="text-left flex-0 border border-[#222222] bg-[#0A0A0A] rounded-xl p-3 lg:p-5 flex items-center gap-5 w-full lg:w-[420px] group relative hover:border-[#444] transition-colors"
                    >
                      <div className="w-12 h-14 bg-[#1A1A1A] rounded-lg relative shrink-0 flex items-center justify-center">
                        <FileText className="text-[#E5D5B8]" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm lg:text-base font-medium leading-tight mb-1 truncate" title={file.title}>
                          {file.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[#E5D5B8] text-sm underline underline-offset-4">
                            Open in File Manager
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyFileState onAction={() => setIsUploadModalOpen(true)} actionLabel="Upload Files" />
              )}
            </div>
          ) : null}
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName="Pre Production"
        uploadPath={workspaceName ? `${workspaceName}/Pre-Production` : undefined}
        onUploadComplete={loadPreProduction}
      />
    </div>
  );
}
