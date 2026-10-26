"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { listenForForegroundPush, registerBrowserPush } from "@/lib/browserPush";
import { notificationPortalPaths, notifyNotificationsChanged, type NotificationPortal } from "@/lib/notificationCenterApi";

export default function WebPushRegistration({ userType }: { userType?: unknown }) {
  const registrationAttempt = useRef<Promise<unknown> | null>(null);

  useEffect(() => {
    registrationAttempt.current ??= registerBrowserPush(userType)
      .then((result) => {
        console.info("[WebPush] Registration result", { userType, status: result.status });
        if (result.status === "permission-denied") {
          toast.error("Browser notifications are blocked. Enable them in browser site settings to receive alerts.");
        } else if (result.status === "not-configured") {
          console.warn("Browser push is not configured: Firebase public environment variables are missing.");
        } else if (result.status === "unsupported" || result.status === "token-unavailable") {
          console.warn("Browser push is unavailable in this browser:", result.status);
        }
      })
      .catch((error) => console.error("Browser push registration failed:", error));

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    listenForForegroundPush(userType, (payload) => {
      notifyNotificationsChanged();
      // Temporary test log: inspect the complete FCM payload in the recipient tab.
      console.info("[WebPush] Full foreground payload (testing)", payload);
      const title = payload?.notification?.title || "New notification";
      const body = payload?.notification?.body || "You have a new notification.";
      console.info("[WebPush] Foreground push received", {
        title,
        type: payload?.data?.type || null,
        roomId: payload?.data?.roomId || null,
        meetingId: payload?.data?.meetingId || payload?.data?.meeting_id || null,
        messageId: payload?.data?.messageId || null,
      });

      toast(title, {
        description: body,
      });

      // FCM sends foreground messages to this page instead of displaying a
      // browser notification automatically. Show the same native notification
      // the user receives while the page is in the background.
      if (Notification.permission === "granted") {
        const roomId = String(payload?.data?.room_id || payload?.data?.chat_room_id || payload?.data?.roomId || payload?.data?.chatRoomId || "").trim();
        const notificationId = String(payload?.data?.notification_id || "").trim();
        const topic = String(payload?.data?.topic || payload?.data?.category || "").toLowerCase();
        const meetingId = String(payload?.data?.meetingId || payload?.data?.meeting_id || "").trim();
        const notification = new Notification(title, {
          body,
          icon: "/icon.png",
          data: { roomId, meetingId, topic, notificationId },
        });
        notification.onclick = () => {
          window.focus();
          const basePath = Number(userType) === 1 ? "/admin" : Number(userType) === 2 ? "/creator/dashboard" : "/affiliate";
          const portal: NotificationPortal = Number(userType) === 2 ? "creator" : Number(userType) === 3 ? "client" : "admin";
          const destination = notificationId
            ? notificationPortalPaths[portal] + "?notificationId=" + encodeURIComponent(notificationId)
            : topic === "shoots"
            ? portal === "creator" ? "/creator/dashboard/request" : basePath + "/shoots"
            : topic === "files"
            ? basePath + "/file-manager"
            : meetingId
            ? basePath + "/meetings?meetingId=" + encodeURIComponent(meetingId)
            : roomId
            ? basePath + "/messages?roomId=" + encodeURIComponent(roomId)
            : notificationPortalPaths[portal];
          window.location.assign(destination);
          notification.close();
        };
      }
    }).then((cleanup) => {
      if (cancelled) cleanup();
      else unsubscribe = cleanup;
    }).catch((error) => console.error("Browser push listener failed:", error));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [userType]);

  return null;
}
