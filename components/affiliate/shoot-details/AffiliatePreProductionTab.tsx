"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, Folder, Loader2, Upload, CloudUpload } from "lucide-react";
import FileViewerModal from "@/components/admin/file-manager/FileViewerModal";
import EmptyFileState from "@/components/admin/file-manager/EmptyFileState";
import UploadModal from "@/components/admin/file-manager/UploadFilesModal";
import { fileManagerApi } from "@/lib/fileManagerApi";

interface AffiliatePreProductionTabProps {
  projectId: string;
}

const prettifyFolderName = (name?: string) => {
  const normalized = String(name || "").trim();
  if (!normalized) return "Folder";
  return normalized.replace(/-/g, " ");
};

export default function AffiliatePreProductionTab({ projectId }: AffiliatePreProductionTabProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [viewerType, setViewerType] = useState("");
  const [viewerMetaId, setViewerMetaId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadPreProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileManagerApi.getExternalWorkspaceFiles(projectId, "pre", currentPath || undefined);
      setWorkspaceName(response?.workspace?.folderName || "");
      setFolders(response?.folders || []);
      setFiles(response?.files || []);
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
  }, [projectId, currentPath]);

  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join("/"));
  };

  const handleOpenFile = async (file: any) => {
    try {
      setViewerOpen(true);
      setViewerUrl(null);
      setViewerName(file.name);
      setViewerType(file.contentType || "");
      setViewerMetaId(file.path || null);
      const response = await fileManagerApi.getExternalFileViewUrl(file.path);
      setViewerUrl(response.url || null);
    } catch {
      setViewerOpen(false);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <div className="flex items-center justify-between bg-[#111111] lg:p-2 rounded-lg lg:rounded-2xl border border-[#222222] min-h-[46px] lg:min-h-[72px]">
        <div className="px-6 text-[#666666] text-xs lg:text-base font-medium">
          {workspaceName ? `Live Pre Production for ${workspaceName}` : "Open and manage Pre Production files"}
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-white text-black px-6 h-full min-h-[46px] lg:min-h-[72px] rounded-r-lg lg:rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!workspaceName}
        >
          <CloudUpload size={20} />
          <span className="text-xs lg:text-base leading-none">Upload File</span>
        </button>
      </div>

      {currentPath && (
        <button onClick={handleBack} className="text-white hover:text-white/80 transition-colors flex items-center gap-2">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

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
                    key={folder.path}
                    onClick={() => {
                      const nextPath = [currentPath, folder.name].filter(Boolean).join("/");
                      setCurrentPath(nextPath);
                    }}
                    className="text-left flex items-center justify-between rounded-2xl border border-[#222222] bg-[#0A0A0A] px-5 py-4 hover:border-[#444] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="text-[#E5D5B8]" size={20} />
                      <div>
                        <div className="text-white font-medium">{prettifyFolderName(folder.name)}</div>
                        <div className="text-xs text-[#888]">{folder.fileCount || 0} files</div>
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
              <div className="px-6 py-4 border-b border-[#222222] bg-[#161616]">
                <h3 className="text-[#E5D5B8] text-base font-medium leading-none">Files</h3>
              </div>

              {files.length > 0 ? (
                <div className="p-3 lg:p-6 flex gap-6 flex-wrap">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleOpenFile(file)}
                      className="text-left flex-0 border border-[#222222] bg-[#0A0A0A] rounded-xl p-3 lg:p-5 flex items-center gap-5 w-full lg:w-[420px] group relative hover:border-[#444] transition-colors"
                    >
                      <div className="w-12 h-14 bg-[#1A1A1A] rounded-lg relative shrink-0 flex items-center justify-center">
                        <FileText className="text-[#E5D5B8]" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm lg:text-base font-medium leading-tight mb-1 truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[#E5D5B8] text-sm underline underline-offset-4">View File</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyFileState
                  title="No File Uploaded"
                  description="No files have been uploaded for this project yet."
                  onAction={() => setIsUploadModalOpen(true)}
                  actionLabel="Upload Files"
                />
              )}
            </div>
          ) : null}
        </div>
      )}

      <FileViewerModal
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerMetaId(null);
        }}
        fileName={viewerName}
        fileUrl={viewerUrl}
        contentType={viewerType}
        fileMetaId={viewerMetaId}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        folderName={currentPath ? prettifyFolderName(currentPath.split("/").slice(-1)[0]) : "Pre Production"}
        uploadPath={workspaceName ? `${workspaceName}/Pre-Production${currentPath ? `/${currentPath}` : ""}` : undefined}
        onUploadComplete={loadPreProduction}
      />
    </div>
  );
}
