"use client";

export const PERMISSIONS_UPDATED_KEY = "permissions_updated";
export const PERMISSIONS_REFRESH_EVENT = "permissions:refresh";

/**
 * Notify all browser tabs that permissions have changed.
 * Other tabs listen via the storage event; the same tab listens via a custom event.
 */
export const broadcastPermissionsUpdated = () => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PERMISSIONS_UPDATED_KEY, Date.now().toString());
  window.dispatchEvent(new CustomEvent(PERMISSIONS_REFRESH_EVENT));
};

export const subscribeToPermissionsUpdates = (
  onUpdate: () => void,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PERMISSIONS_UPDATED_KEY) {
      onUpdate();
    }
  };

  const handleSameTabRefresh = () => {
    onUpdate();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PERMISSIONS_REFRESH_EVENT, handleSameTabRefresh);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PERMISSIONS_REFRESH_EVENT, handleSameTabRefresh);
  };
};
