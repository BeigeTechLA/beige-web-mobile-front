import axios from "axios";
import apiClient from "@/lib/apiClient";

export interface ProjectUserRef {
  user_id: number;
  name: string;
  email?: string;
}

export interface ProjectItem {
  project_id: number;
  project_code: string;
  project_name: string;
  current_state: string;
  state_display_name?: string;
  state_category?: string;
  total_files_count?: number;
  updated_at?: string;
  created_at?: string;
  client?: ProjectUserRef | null;
  assigned_creator?: ProjectUserRef | null;
  booking?: {
    booking_id: number;
    project_name?: string;
    event_date?: string;
    event_location?: string;
  } | null;
}

export interface ProjectFileItem {
  file_id: number;
  file_category: string;
  file_name: string;
  file_size_bytes: number;
  file_extension?: string;
  mime_type?: string;
  upload_status?: string;
  validation_status?: string;
  created_at?: string;
  updated_at?: string;
  uploaded_by?: {
    user_id: number;
    name: string;
  } | null;
}

interface ProjectsResponse {
  success: boolean;
  data: {
    projects: ProjectItem[];
  };
}

interface ProjectResponse {
  success: boolean;
  data: ProjectItem;
}

interface ProjectFilesResponse {
  success: boolean;
  data: {
    project_id: number;
    files: ProjectFileItem[];
  };
}

interface ExternalWorkspaceSummary {
  externalId: string;
  folderName: string;
  rootPath: string;
  fullPath?: string;
  consoleUrl?: string | null;
  fileCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isCommonEvent?: boolean;
  eventId?: string | number;
  eventName?: string;
}

interface ExternalWorkspaceFolder {
  name: string;
  path: string;
  fullPath?: string;
  folderType?: string | null;
  fileCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ExternalWorkspaceFile {
  id: string;
  name: string;
  path: string;
  fullPath?: string;
  size?: number;
  contentType?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ExternalWorkspacesResponse {
  success: boolean;
  data: {
    workspaces: ExternalWorkspaceSummary[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

interface ExternalWorkspaceResponse {
  success: boolean;
  data: {
    workspace: ExternalWorkspaceSummary;
    folders: ExternalWorkspaceFolder[];
    files: ExternalWorkspaceFile[];
  };
}

interface ExternalWorkspaceFilesResponse {
  success: boolean;
  data: {
    workspace: ExternalWorkspaceSummary;
    folders: ExternalWorkspaceFolder[];
    files: ExternalWorkspaceFile[];
    phase?: string;
    path?: string;
    basePath?: string;
  };
}

interface ExternalWorkspaceCreateResponse {
  success: boolean;
  data: {
    workspace: ExternalWorkspaceSummary;
    folders: ExternalWorkspaceFolder[];
    files: ExternalWorkspaceFile[];
  };
}

interface ExternalUploadPolicyResponse {
  success: boolean;
  data: {
    url: string;
    fields: Record<string, string>;
    filePath: string;
    success: boolean;
  };
}

interface CommonEventResponse {
  success: boolean;
  data: Array<{
    eventId: number;
    eventName: string;
    eventSlug: string;
    externalId: string;
    rootPath?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
}

interface CreateCommonEventResponse {
  success: boolean;
  data: {
    eventName: string;
    eventSlug: string;
    externalId: string;
    workspace?: ExternalWorkspaceSummary | null;
  };
}

interface FaceScanResponse {
  success: boolean;
  data: {
    externalId: string;
    scanMode: "full_face_scan" | "indexed_plus_fallback_scan";
    integrated: boolean;
    candidatesCount: number;
    indexedCandidatesCount?: number;
    scannedCandidatesCount?: number;
    backgroundIndexQueued?: number;
    noFaceDetectedInScanImage?: boolean;
    minScore?: number;
    indexStatus?: {
      state: "ready" | "partial" | "not_indexed" | "indexing" | "empty";
      totalCandidates: number;
      readyCandidates: number;
      skippedCandidates?: number;
      pendingCandidates: number;
      coverage: number;
    };
    matches: Array<{
      path?: string;
      score?: number;
      confidence?: number;
      [key: string]: unknown;
    }>;
    provider?: string | null;
  };
}

interface FaceScanIndexStatusResponse {
  success: boolean;
  data: {
    externalId: string;
    state: "ready" | "partial" | "not_indexed" | "indexing" | "empty";
    totalCandidates: number;
    readyCandidates: number;
    skippedCandidates?: number;
    indexingCandidates: number;
    failedCandidates: number;
    pendingCandidates: number;
    coverage: number;
  };
}

export interface UiFolderItem {
  id: string;
  title: string;
  fileCount: number;
  category?: string;
  isLinked?: boolean;
  lastOpened: string;
  userInitials: string;
  href?: string;
  type?: string;
  resourcePath?: string;
  updatedAtRaw?: string;
}

const DEFAULT_FILE_MANAGER_BASE_PATH = "/production-manager/file-manager";

export interface UiFileItem {
  id: string;
  title: string;
  lastOpened: string;
  userInitials: string;
  downloadUrl?: string;
  fileCategory: string;
  fileSizeBytes: number;
  filepath?: string;
  contentType?: string;
}

export interface FileCommentUser {
  id?: string | number;
  name?: string | null;
  email?: string | null;
  profile_picture?: string | null;
  role?: string | null;
}

export interface FileCommentItem {
  id: string;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: number | null;
  userId?: FileCommentUser | null;
  replies?: FileCommentItem[];
  reactions?: Array<{
    type?: string;
    count?: number;
    users?: string[];
  }>;
}

const PRE_PRODUCTION_CATEGORIES = ["REFERENCE_MATERIAL", "THUMBNAIL"];
const RAW_FOOTAGE_CATEGORIES = ["RAW_FOOTAGE", "RAW_AUDIO"];
const EDITED_FOOTAGE_CATEGORIES = ["EDIT_DRAFT", "EDIT_REVISION"];
const FINAL_DELIVERABLE_CATEGORIES = ["EDIT_FINAL", "CLIENT_DELIVERABLE"];

const prettifyExternalFolderName = (name?: string) => {
  const normalized = String(name || "").trim();
  if (!normalized) return "Folder";
  if (normalized === "Pre-Production") return "Pre Production";
  if (normalized === "Post-Production") return "Post Production";
  if (normalized === "Raw Footage") return "Raw Footages";
  return normalized.replace(/-/g, " ");
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
};

export const isRecentWithinHours = (value?: string, hours: number = 6) => {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000;
};

export const inferWorkspaceCategory = (name?: string) => {
  const normalized = String(name || "").trim().toLowerCase();

  if (!normalized) return "Project";
  if (normalized.startsWith("event -")) return "Common Event";
  if (normalized.includes("wedding")) return "Wedding";
  if (normalized.includes("corporate")) return "Corporate Event";
  if (normalized.includes("commercial")) return "Commercial & Advertising";
  if (normalized.includes("behind")) return "Behind-the-Scenes";
  if (normalized.includes("social") || normalized.includes("influencer")) return "Social Content";
  if (normalized.includes("private")) return "Private Events";

  return "Project";
};

const getInitials = (name?: string | null) => {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

export const getDisplayInitials = (name?: string | null) => {
  const initials = getInitials(name);
  return initials === "NA" ? "FM" : initials;
};

const byCategories = (files: ProjectFileItem[], categories: string[]) =>
  files.filter((file) => categories.includes(file.file_category));

export const fileManagerApi = {
  async getProjects() {
    const response = await apiClient.get<ProjectsResponse>("projects/user");
    return response.data.projects || [];
  },

  async getProject(projectId: string | number) {
    const response = await apiClient.get<ProjectResponse>(`projects/${projectId}`);
    return response.data;
  },

  async getProjectFiles(projectId: string | number) {
    const response = await apiClient.get<ProjectFilesResponse>(`projects/${projectId}/files`);
    return response.data.files || [];
  },

  async getDownloadUrl(fileId: string | number) {
    const response = await apiClient.get<{ success: boolean; data: { download_url: string } }>(
      `projects/files/${fileId}/download-url`
    );
    return response.data.download_url;
  },

  async deleteFile(fileId: string | number) {
    return apiClient.delete(`projects/files/${fileId}`);
  },

  async listExternalWorkspaces() {
    const response = await apiClient.get<ExternalWorkspacesResponse>("external-file-manager/workspaces");
    return response.data.workspaces || [];
  },

  async listExternalWorkspacesPaginated(options?: { page?: number; limit?: number; search?: string }) {
    const params: Record<string, string | number> = {};
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.search) params.search = options.search;

    const response = await apiClient.get<ExternalWorkspacesResponse>(
      "external-file-manager/workspaces",
      params
    );
    return {
      workspaces: response.data.workspaces || [],
      pagination: response.data.pagination || {
        page: options?.page || 1,
        limit: options?.limit || (response.data.workspaces || []).length || 1,
        total: (response.data.workspaces || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  async listCommonEvents() {
    const response = await apiClient.get<CommonEventResponse>("external-file-manager/common-events");
    return response.data || [];
  },

  async createCommonEvent(eventName: string, externalId?: string) {
    const response = await apiClient.post<CreateCommonEventResponse>("external-file-manager/common-events", {
      eventName,
      externalId,
    });
    return response.data;
  },

  async createCreatorEventFolder(
    eventExternalId: string,
    folderName?: string,
    options?: { phase?: string; path?: string }
  ) {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        externalId: string;
        phase?: string;
        path?: string | null;
        folderName: string;
        folder: Record<string, unknown> | null;
      };
    }>(`external-file-manager/common-events/${eventExternalId}/creator-folder`, {
      folderName,
      phase: options?.phase,
      path: options?.path,
    });
    return response.data;
  },

  async searchFaceMatches(payload: {
    externalId: string;
    scanImageBase64?: string;
    scanImageUrl?: string;
    threshold?: number;
    minScore?: number;
    maxResults?: number;
    candidateLimit?: number;
    fallbackCandidateLimit?: number;
    backgroundReindex?: boolean;
    backgroundBatchLimit?: number;
    backgroundConcurrency?: number;
    providerTimeoutMs?: number;
  }) {
    const response = await apiClient.post<FaceScanResponse>("external-file-manager/face-scan/search", payload);
    return response.data;
  },

  async getFaceScanIndexStatus(externalId: string) {
    const response = await apiClient.get<FaceScanIndexStatusResponse>(
      `external-file-manager/face-scan/index-status/${encodeURIComponent(String(externalId || ""))}`
    );
    return response.data;
  },

  async reindexFaceEmbeddings(payload: {
    externalId: string;
    candidateLimit?: number;
    concurrency?: number;
  }) {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        externalId: string;
        totalCandidates: number;
        selectedCandidates: number;
        indexed: number;
        skipped: number;
        failed: number;
      };
    }>("external-file-manager/face-scan/reindex", payload);
    return response.data;
  },

  async getExternalWorkspace(externalId: string | number) {
    const response = await apiClient.get<ExternalWorkspaceResponse>(
      `external-file-manager/workspace/${externalId}`
    );
    return response.data || null;
  },

  async getExternalWorkspaceFiles(externalId: string | number, phase?: string, path?: string) {
    const params: Record<string, string> = {};
    if (phase) params.phase = phase;
    if (path) params.path = path;
    const response = await apiClient.get<ExternalWorkspaceFilesResponse>(
      `external-file-manager/workspace/${externalId}/files`,
      params
    );
    return response.data;
  },

  async createExternalWorkspace(bookingId: string | number, folderName: string) {
    const response = await apiClient.post<ExternalWorkspaceCreateResponse>(
      "external-file-manager/workspace",
      {
        bookingId: String(bookingId),
        folderName,
      }
    );
    return response.data;
  },

  async getExternalUploadPolicy(filepath: string, fileContentType: string, fileSize: number) {
    const response = await apiClient.post<ExternalUploadPolicyResponse>(
      "external-file-manager/upload-policy",
      { filepath, fileContentType, fileSize }
    );
    return response.data;
  },

  async notifyExternalFileUploaded(filepath: string, file: File) {
    return apiClient.post("external-file-manager/file-uploaded", {
      filepath,
      fileContentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    });
  },

  async uploadExternalFile(
    uploadPolicy: { url: string; fields: Record<string, string> },
    file: File,
    onProgress?: (progress: number) => void
  ) {
    const data = new FormData();
    Object.entries(uploadPolicy.fields || {}).forEach(([key, value]) => {
      data.append(key, value);
    });
    data.append("file", file);

    await axios.post(uploadPolicy.url, data, {
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(event.loaded / event.total);
      },
    });
  },

  async getExternalFileViewUrl(filepath: string) {
    const response = await apiClient.post<{ success: boolean; data: { url: string; duration: number } }>(
      "external-file-manager/file-view-url",
      { filepath }
    );
    return response.data;
  },

  async getExternalFileDownloadUrl(filepath: string) {
    const response = await apiClient.post<{ success: boolean; data: { url: string; duration: number } }>(
      "external-file-manager/file-download-url",
      { filepath }
    );
    return response.data;
  },

  async getExternalFolderDownloadUrl(
    externalId: string | number,
    options?: { phase?: string; path?: string }
  ) {
    const response = await apiClient.post<{ success: boolean; data: { url: string; filepath: string } }>(
      "external-file-manager/folder-download-url",
      {
        externalId: String(externalId),
        phase: options?.phase,
        path: options?.path,
      }
    );
    return response.data;
  },

  async deleteExternalEntry(filepath: string) {
    return apiClient.post("external-file-manager/delete", { filepath });
  },

  async createExternalFolder(
    externalId: string | number,
    folderName: string,
    options?: { phase?: string; path?: string }
  ) {
    const response = await apiClient.post<{
      success: boolean;
      data: { folder: Record<string, unknown> | null; alreadyExists: boolean };
    }>("external-file-manager/folder", {
      externalId: String(externalId),
      folderName,
      phase: options?.phase,
      path: options?.path,
    });
    return response.data;
  },

  async getComments(fileMetaId: string) {
    return apiClient.get<FileCommentItem[]>("comments", { metaId: fileMetaId });
  },

  async addComment(payload: { fileMetaId: string; user_id: string | number; comment: string; timestamp?: number | null }) {
    return apiClient.post<FileCommentItem>("comments", payload);
  },

  async replyToComment(commentId: string, payload: { user_id: string | number; comment: string }) {
    return apiClient.post<FileCommentItem>(`comments/${commentId}/reply`, payload);
  },

  async deleteComment(commentId: string, userId: string | number) {
    const response = await apiClient.getInstance().delete(`comments/${commentId}`, {
      data: { user_id: userId },
    });
    return response.data;
  },
};

export const mapProjectToFolderCard = (
  project: ProjectItem,
  basePath: string = DEFAULT_FILE_MANAGER_BASE_PATH
): UiFolderItem => ({
  id: String(project.project_id),
  title: project.project_name || project.project_code,
  fileCount: project.total_files_count || 0,
  category: project.state_display_name || project.current_state,
  isLinked: true,
  lastOpened: formatRelativeTime(project.updated_at || project.created_at),
  userInitials: getInitials(project.assigned_creator?.name || project.client?.name),
  href: `${basePath}/${project.project_id}`,
  updatedAtRaw: project.updated_at || project.created_at,
});

export const buildProjectRootFolders = (
  project: ProjectItem,
  files: ProjectFileItem[],
  basePath: string = DEFAULT_FILE_MANAGER_BASE_PATH
): UiFolderItem[] => {
  const userInitials = getInitials(project.assigned_creator?.name || project.client?.name);
  const lastOpened = formatRelativeTime(project.updated_at || project.created_at);
  const projectPath = `${basePath}/${project.project_id}`;

  return [
    {
      id: `${project.project_id}-pre`,
      title: "Pre Production",
      fileCount: byCategories(files, PRE_PRODUCTION_CATEGORIES).length,
      lastOpened,
      userInitials,
      type: "pre-production",
      href: `${projectPath}/pre-production`,
    },
    {
      id: `${project.project_id}-post`,
      title: "Post Production",
      fileCount:
        byCategories(files, RAW_FOOTAGE_CATEGORIES).length +
        byCategories(files, EDITED_FOOTAGE_CATEGORIES).length +
        byCategories(files, FINAL_DELIVERABLE_CATEGORIES).length,
      lastOpened,
      userInitials,
      type: "post-production",
      href: `${projectPath}/post-production`,
    },
  ];
};

export const buildPostProductionFolders = (
  project: ProjectItem,
  files: ProjectFileItem[],
  basePath: string = DEFAULT_FILE_MANAGER_BASE_PATH
): UiFolderItem[] => {
  const userInitials = getInitials(project.assigned_creator?.name || project.client?.name);
  const lastOpened = formatRelativeTime(project.updated_at || project.created_at);
  const projectId = String(project.project_id);
  const projectPath = `${basePath}/${projectId}`;

  return [
    {
      id: `${projectId}-raw`,
      title: "Raw Footages",
      fileCount: byCategories(files, RAW_FOOTAGE_CATEGORIES).length,
      lastOpened,
      userInitials,
      type: "raw-footage",
      href: `${projectPath}/post-production/raw-footage`,
    },
    {
      id: `${projectId}-edited`,
      title: "Edited Footages",
      fileCount: byCategories(files, EDITED_FOOTAGE_CATEGORIES).length,
      lastOpened,
      userInitials,
      type: "edited-footage",
      href: `${projectPath}/post-production/edited-footage`,
    },
    {
      id: `${projectId}-final`,
      title: "Final Deliverables",
      fileCount: byCategories(files, FINAL_DELIVERABLE_CATEGORIES).length,
      lastOpened,
      userInitials,
      type: "final-deliverables",
      href: `${projectPath}/post-production/final-deliverables`,
    },
  ];
};

export const mapFilesForUi = (files: ProjectFileItem[]): UiFileItem[] =>
  files.map((file) => ({
    id: String(file.file_id),
    title: file.file_name,
    lastOpened: formatRelativeTime(file.updated_at || file.created_at),
    userInitials: getInitials(file.uploaded_by?.name),
    fileCategory: file.file_category,
    fileSizeBytes: file.file_size_bytes,
  }));

export const getFilesForFolderView = (
  files: ProjectFileItem[],
  phaseSlug?: string,
  nestedSlug?: string
) => {
  if (phaseSlug === "pre-production") {
    return byCategories(files, PRE_PRODUCTION_CATEGORIES);
  }

  if (phaseSlug === "post-production" && nestedSlug === "raw-footage") {
    return byCategories(files, RAW_FOOTAGE_CATEGORIES);
  }

  if (phaseSlug === "post-production" && nestedSlug === "edited-footage") {
    return byCategories(files, EDITED_FOOTAGE_CATEGORIES);
  }

  if (phaseSlug === "post-production" && nestedSlug === "final-deliverables") {
    return byCategories(files, FINAL_DELIVERABLE_CATEGORIES);
  }

  return [];
};

export const slugToWorkspaceName = (slug?: string) => {
  if (!slug) return "";
  if (slug === "raw-footage") return "Raw Footage";
  if (slug === "edited-footage") return "Edited Footage";
  if (slug === "final-deliverables") return "Final Deliverables";
  if (slug === "pre-production") return "Pre-Production";
  if (slug === "post-production") return "Post-Production";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const isCommonEventWorkspaceId = (workspaceId?: string | number) =>
  String(workspaceId || "").toLowerCase().startsWith("event_");

export const mapExternalWorkspaceToFolderCard = (
  workspace: ExternalWorkspaceSummary,
  basePath: string
): UiFolderItem => ({
  id: workspace.externalId,
  title: workspace.folderName,
  fileCount: workspace.fileCount || 0,
  category: workspace.isCommonEvent ? "Common Event" : inferWorkspaceCategory(workspace.folderName),
  isLinked: true,
  lastOpened: formatRelativeTime(workspace.updatedAt || workspace.createdAt),
  userInitials: getDisplayInitials(workspace.folderName),
  href: `${basePath}/${workspace.externalId}`,
  resourcePath: workspace.rootPath,
  updatedAtRaw: workspace.updatedAt || workspace.createdAt,
});

export const mapExternalFoldersToUi = (
  folders: ExternalWorkspaceFolder[],
  buildHref: (folder: ExternalWorkspaceFolder) => string
): UiFolderItem[] =>
  folders.map((folder) => ({
    id: folder.path,
    title: prettifyExternalFolderName(folder.name),
    fileCount: folder.fileCount || 0,
    category: folder.folderType || "folder",
    isLinked: true,
    lastOpened: formatRelativeTime(folder.updatedAt || folder.createdAt),
  userInitials: getDisplayInitials(folder.name),
  href: buildHref(folder),
  resourcePath: folder.path,
  updatedAtRaw: folder.updatedAt || folder.createdAt,
}));

export const mapExternalFilesToUi = (files: ExternalWorkspaceFile[]): UiFileItem[] =>
  files.map((file) => ({
    id: file.id,
    title: file.name,
    lastOpened: formatRelativeTime(file.updatedAt || file.createdAt),
    userInitials: getDisplayInitials(file.name),
    fileCategory: file.contentType || "file",
    fileSizeBytes: file.size || 0,
    filepath: file.path,
    contentType: file.contentType || "application/octet-stream",
  }));
