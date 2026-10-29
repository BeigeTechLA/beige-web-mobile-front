"use client";

import { useCallback, useEffect, useState } from "react";
import { editorWorkflowApi, type WorkflowActivityItem, type WorkflowDetail, type WorkflowItem } from "@/lib/editorWorkflowApi";
import { fileManagerApi } from "@/lib/fileManagerApi";

type WorkspaceFiles = Awaited<ReturnType<typeof fileManagerApi.getExternalWorkspaceFiles>>;

export type EditorWorkflowError = Error & { status?: number };
export type EditorWorkspaceFile = {
  id: string; name: string; path: string; size?: number; contentType?: string; author?: string;
  updatedAt?: string; createdAt?: string; metadata?: Record<string, unknown>; previewUrl?: string;
};

const filePath = (file: EditorWorkspaceFile) => String(file.path || "").trim();

const asError = (value: unknown) => value as EditorWorkflowError;

export function useEditorWorkflowList() {
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [storage, setStorage] = useState({ usedBytes: 0, totalBytes: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EditorWorkflowError | null>(null);

  const load = useCallback(async (params: { page?: number; limit?: number; status?: string; search?: string; sortBy?: string; sortOrder?: string } = {}) => {
    setLoading(true); setError(null);
    try {
      const result = await editorWorkflowApi.list({ page: 1, limit: 20, sortBy: "dueDate", sortOrder: "asc", ...params });
      setItems(result.items || []); setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      setStatusCounts(result.statusCounts || {}); setStorage(result.storage || { usedBytes: 0, totalBytes: 0, percent: 0 });
    } catch (caught) { setError(asError(caught)); }
    finally { setLoading(false); }
  }, []);
  return { items, pagination, statusCounts, storage, loading, error, load };
}

export function useEditorWorkflow(bookingId?: string) {
  const [detail, setDetail] = useState<WorkflowDetail | null>(null);
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof editorWorkflowApi.progress>> | null>(null);
  const [files, setFiles] = useState<WorkspaceFiles | null>(null);
  const [activity, setActivity] = useState<WorkflowActivityItem[]>([]);
  const [folderPath, setFolderPath] = useState("");
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState<EditorWorkflowError | null>(null);

  const externalId = detail?.externalId || detail?.bookingId || bookingId;
  const load = useCallback(async (path = "") => {
    if (!bookingId) return;
    setLoading(true); setError(null);
    try {
      const [workflow, workflowProgress] = await Promise.all([editorWorkflowApi.get(bookingId), editorWorkflowApi.progress(bookingId)]);
      setDetail(workflow); setProgress(workflowProgress);
      try {
        const activityResponse = await editorWorkflowApi.activity(bookingId);
        setActivity(Array.isArray(activityResponse) ? activityResponse : activityResponse.items || activityResponse.activity || []);
      } catch { setActivity(workflow.statusHistory || []); }
      const workspaceId = workflow.externalId || workflow.bookingId;
      if (workspaceId !== undefined && workspaceId !== null) {
        const workspaceFiles = await fileManagerApi.getExternalWorkspaceFiles(workspaceId, "post", path);
        setFiles(workspaceFiles); setFolderPath(path);
        const imageFiles = ((workspaceFiles?.files || []) as EditorWorkspaceFile[]).filter((file) => String(file.contentType || "").startsWith("image/") && filePath(file));
        const previews = await Promise.all(imageFiles.map(async (file) => {
          try { return [filePath(file), (await fileManagerApi.getExternalFileViewUrl(filePath(file))).url] as const; } catch { return [filePath(file), ""] as const; }
        }));
        setFilePreviews((current) => ({ ...current, ...Object.fromEntries(previews.filter(([, url]) => url)) }));
      }
    } catch (caught) { setError(asError(caught)); }
    finally { setLoading(false); }
  }, [bookingId]);

  const refresh = useCallback(async (path = "") => load(path), [load]);
  useEffect(() => { void load(); }, [load]);

  const write = useCallback(async (action: () => Promise<unknown>, path = "") => {
    try { const result = await action(); await refresh(path); return result; }
    catch (caught) { throw asError(caught); }
  }, [refresh]);

  const loadFolder = useCallback(async (path: string) => load(path), [load]);
  return { detail, progress, files, activity, folderPath, filePreviews, externalId, loading, error, load, loadFolder, refresh, write };
}
