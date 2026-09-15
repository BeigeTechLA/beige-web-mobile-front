declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export const pushToDataLayer = (eventName: string, properties: Record<string, any> = {}) => {
  // if (typeof window !== "undefined" && (window as any).dataLayer) {
  //   (window as any).dataLayer.push({
  //     event: eventName,
  //     ...properties,
  //     // page_name: document.title,
  //     page_url: window.location.href,
  //     timestamp: new Date().toISOString(),
  //   });
  // }
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...properties,
    page_url: window.location.href,
    timestamp: new Date().toISOString(),
  });
};