"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { listenForForegroundPush, registerBrowserPush } from "@/lib/browserPush";

export default function WebPushRegistration({ userType }: { userType?: unknown }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    registerBrowserPush(userType)
      .then((result) => {
        if (result.status === "permission-denied") {
          toast.error("Browser notifications are blocked. Enable them in browser site settings to receive alerts.");
        } else if (result.status === "not-configured") {
          console.warn("Browser push is not configured: Firebase public environment variables are missing.");
        }
      })
      .catch((error) => console.error("Browser push registration failed:", error));

    let unsubscribe: (() => void) | undefined;
    listenForForegroundPush(userType, (payload) => {
      const title = payload?.notification?.title || "New notification";
      const body = payload?.notification?.body || "You have a new notification.";
      console.info("[WebPush] Foreground push received", {
        title,
        type: payload?.data?.type || null,
        roomId: payload?.data?.roomId || null,
        meetingId: payload?.data?.meetingId || null,
        messageId: payload?.data?.messageId || null,
      });

      toast(title, {
        description: body,
      });

      // FCM sends foreground messages to this page instead of displaying a
      // browser notification automatically. Show the same native notification
      // the user receives while the page is in the background.
      if (Notification.permission === "granted") {
        const roomId = String(payload?.data?.roomId || payload?.data?.chatRoomId || "").trim();
        const meetingId = String(payload?.data?.meetingId || "").trim();
        const notification = new Notification(title, {
          body,
          icon: "/icon.png",
          data: { roomId, meetingId },
        });
        notification.onclick = () => {
          window.focus();
          const basePath = Number(userType) === 2 ? "/creator/dashboard" : "/affiliate";
          const destination = meetingId
            ? basePath + "/meetings?meetingId=" + encodeURIComponent(meetingId)
            : basePath + "/messages" + (roomId ? "?roomId=" + encodeURIComponent(roomId) : "");
          window.location.assign(destination);
          notification.close();
        };
      }
    }).then((cleanup) => { unsubscribe = cleanup; });

    return () => unsubscribe?.();
  }, [userType]);

  return null;
}
