"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from "firebase/messaging";
import apiClient from "@/lib/apiClient";

type AppUserType = 2 | 3;

const getFirebaseConfig = (appUserType: AppUserType) => {
  const isClient = appUserType === 3;
  const config = isClient ? {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_APP_ID,
  } : {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_CP_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_CP_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_CP_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CP_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_CP_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_CP_APP_ID,
  };
  return {
    config,
    vapidKey: isClient
      ? process.env.NEXT_PUBLIC_FIREBASE_CLIENT_VAPID_KEY
      : process.env.NEXT_PUBLIC_FIREBASE_CP_VAPID_KEY,
  };
};

const resolveAppUserType = (value: unknown): AppUserType | null => {
  const userType = Number(value);
  return userType === 2 || userType === 3 ? userType : null;
};

const getSessionId = () => {
  const key = "beige-web-push-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(key, value);
  return value;
};

export const registerBrowserPush = async (userType: unknown) => {
  const appUserType = resolveAppUserType(userType);
  if (!appUserType) return { status: "not-supported-for-user" as const };
  const { config, vapidKey } = getFirebaseConfig(appUserType);
  if (typeof window === "undefined" || !Object.values(config).every(Boolean) || !vapidKey) {
    return { status: "not-configured" as const };
  }
  if (!(await isSupported())) return { status: "unsupported" as const };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "permission-denied" as const };

  const registration = await navigator.serviceWorker.register(appUserType === 3 ? "/firebase-messaging-client-sw.js" : "/firebase-messaging-cp-sw.js");
  const appName = appUserType === 3 ? "client-push" : "cp-push";
  const app = getApps().some((item) => item.name === appName) ? getApp(appName) : initializeApp(config, appName);
  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return { status: "token-unavailable" as const };
  if (process.env.NODE_ENV !== "production") {
    console.info("[WebPush] FCM token registered for local testing:", token);
  }

  await apiClient.post("push-notifications/tokens", {
    fcm_token: token,
    session_id: getSessionId(),
    device_type: "web",
    notification_preferences: {
      push_enabled: true,
      topics: { shoots: true, messages: true, meetings: true, files: true },
    },
  });
  return { status: "registered" as const, token };
};

export const listenForForegroundPush = async (userType: unknown, onPayload: (payload: MessagePayload) => void) => {
  const appUserType = resolveAppUserType(userType);
  if (!appUserType) return () => undefined;
  const { config } = getFirebaseConfig(appUserType);
  if (typeof window === "undefined" || !Object.values(config).every(Boolean) || !(await isSupported())) return () => undefined;
  const appName = appUserType === 3 ? "client-push" : "cp-push";
  const app = getApps().some((item) => item.name === appName) ? getApp(appName) : initializeApp(config, appName);
  return onMessage(getMessaging(app), onPayload);
};
