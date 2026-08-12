export type FileManagerRouteState = {
  selectedTab: string;
  searchTerm: string;
  currentPage: number;
  visibleFileCount: number;
};

const FILE_MANAGER_ROUTE_STATE_KEY = "admin-file-manager-route-state";

const normalizePathForStateKey = (pathname?: string) =>
  String(pathname || "")
    .toLowerCase()
    .split("?")[0]
    .replace(/\/+$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getFileManagerRouteStateKey = (pathname?: string) => {
  const normalized = String(pathname || "").toLowerCase();
  const routeSuffix = normalizePathForStateKey(pathname);

  if (normalized.startsWith("/sales/file-manager")) {
    return `sales-file-manager-route-state${routeSuffix ? `:${routeSuffix}` : ""}`;
  }

  if (normalized.startsWith("/creator/dashboard/file-manager")) {
    return `creator-file-manager-route-state${routeSuffix ? `:${routeSuffix}` : ""}`;
  }

  if (normalized.startsWith("/admin/file-manager")) {
    return `admin-file-manager-route-state${routeSuffix ? `:${routeSuffix}` : ""}`;
  }

  return FILE_MANAGER_ROUTE_STATE_KEY;
};

const defaultState = (): FileManagerRouteState => ({
  selectedTab: "All folders",
  searchTerm: "",
  currentPage: 1,
  visibleFileCount: 20,
});

const normalizeState = (value: Partial<FileManagerRouteState> | null | undefined): FileManagerRouteState => {
  const defaults = defaultState();

  return {
    selectedTab: typeof value?.selectedTab === "string" && value.selectedTab ? value.selectedTab : defaults.selectedTab,
    searchTerm: typeof value?.searchTerm === "string" ? value.searchTerm : defaults.searchTerm,
    currentPage:
      typeof value?.currentPage === "number" && Number.isFinite(value.currentPage) && value.currentPage > 0
        ? Math.floor(value.currentPage)
        : defaults.currentPage,
    visibleFileCount:
      typeof value?.visibleFileCount === "number" &&
      Number.isFinite(value.visibleFileCount) &&
      value.visibleFileCount > 0
        ? Math.floor(value.visibleFileCount)
        : defaults.visibleFileCount,
  };
};

export const getFileManagerRouteState = (key = FILE_MANAGER_ROUTE_STATE_KEY): FileManagerRouteState => {
  if (typeof window === "undefined") return defaultState();

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return defaultState();

    return normalizeState(JSON.parse(raw) as Partial<FileManagerRouteState>);
  } catch {
    return defaultState();
  }
};

export const setFileManagerRouteState = (state: Partial<FileManagerRouteState>, key = FILE_MANAGER_ROUTE_STATE_KEY) => {
  if (typeof window === "undefined") return;

  try {
    const existingRaw = window.sessionStorage.getItem(key);
    const existingState = existingRaw ? normalizeState(JSON.parse(existingRaw) as Partial<FileManagerRouteState>) : defaultState();
    window.sessionStorage.setItem(
      key,
      JSON.stringify(
        normalizeState({
          ...existingState,
          ...state,
        })
      )
    );
  } catch {
    // Ignore storage failures.
  }
};

export const clearFileManagerRouteState = (key = FILE_MANAGER_ROUTE_STATE_KEY) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
};
