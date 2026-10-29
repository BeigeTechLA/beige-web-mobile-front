"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported, onMessage, type MessagePayload } from "firebase/messaging";
import apiClient from "@/lib/apiClient";

type AppUserType = 1 | 2 | 3;

const getFirebaseConfig = (appUserType: AppUserType) => {
  const isClient = appUserType === 3;
  const isAdmin = appUserType === 1;
  const config = isAdmin ? {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_APP_ID,
  } : isClient ? {
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
    vapidKey: isAdmin
      ? process.env.NEXT_PUBLIC_FIREBASE_ADMIN_VAPID_KEY
      : isClient
      ? process.env.NEXT_PUBLIC_FIREBASE_CLIENT_VAPID_KEY
      : process.env.NEXT_PUBLIC_FIREBASE_CP_VAPID_KEY,
  };
};

const resolveAppUserType = (value: unknown): AppUserType | null => {
  const userType = Number(value);
  return userType === 1 || userType === 2 || userType === 3 ? userType : null;
};


const getPushAppName = (appUserType: AppUserType) =>
  appUserType === 1 ? "admin-push" : appUserType === 3 ? "client-push" : "cp-push";

const getPushServiceWorkerPath = (appUserType: AppUserType) =>
  appUserType === 1 ? "/firebase-messaging-admin-sw.js" : appUserType === 3 ? "/firebase-messaging-client-sw.js" : "/firebase-messaging-cp-sw.js";
const getPushServiceWorkerScope = (appUserType: AppUserType) =>
  appUserType === 1 ? "/admin/" : appUserType === 3 ? "/affiliate/" : "/creator/dashboard/";
const retireLegacyPushWorker = async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations
    .filter((registration) => [registration.active, registration.waiting, registration.installing]
      .some((worker) => worker?.scriptURL.endsWith("/firebase-messaging-sw.js")))
    .map((registration) => registration.unregister()));
};
const getSessionId = () => {
  const key = "beige-web-push-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(key, value);
  return value;
};

const getExistingSessionId = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("beige-web-push-session-id");
};

/**
 * register() resolves once the browser accepts the worker, not once it has
 * activated it. PushManager needs the worker to be active before Firebase
 * creates a subscription.
 */
const waitForActiveServiceWorker = async (registration: ServiceWorkerRegistration) => {
  if (registration.active) return registration;

  const worker = registration.installing || registration.waiting;
  if (!worker) {
    await navigator.serviceWorker.ready;
    if (registration.active) return registration;
    throw new Error("Service worker did not become active after registration.");
  }

  await new Promise<void>((resolve, reject) => {
    const onStateChange = () => {
      if (worker.state === "activated") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        resolve();
      } else if (worker.state === "redundant") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        reject(new Error("Service worker became redundant before activation."));
      }
    };
    const timeout = window.setTimeout(() => {
      worker.removeEventListener("statechange", onStateChange);
      reject(new Error("Timed out waiting for the service worker to activate."));
    }, 10_000);

    worker.addEventListener("statechange", onStateChange);
    onStateChange();
  });

  if (!registration.active) {
    throw new Error("Service worker activated but is unavailable for push registration.");
  }
  return registration;
};

export const registerBrowserPush = async (userType: unknown) => {
  const appUserType = resolveAppUserType(userType);
  if (!appUserType) return { status: "not-supported-for-user" as const };
  const { config, vapidKey } = getFirebaseConfig(appUserType);
  if (typeof window === "undefined" || !Object.values(config).every(Boolean) || !vapidKey) {
    return { status: "not-configured" as const };
  }
  console.info("[WebPush] Checking browser support", { userType: appUserType });
  if (!(await isSupported())) return { status: "unsupported" as const };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "permission-denied" as const };

  console.info("[WebPush] Preparing service worker", { userType: appUserType });
  await retireLegacyPushWorker();
  // These apps share an origin. Separate scopes prevent one role's Firebase
  // worker from replacing another role's worker at the root scope.
  const serviceWorkerScope = getPushServiceWorkerScope(appUserType);
  const registration = await navigator.serviceWorker.register(getPushServiceWorkerPath(appUserType), {
    scope: serviceWorkerScope,
  });
  await waitForActiveServiceWorker(registration);
  console.info("[WebPush] Service worker active", { userType: appUserType });
  const appName = getPushAppName(appUserType);
  const app = getApps().some((item) => item.name === appName) ? getApp(appName) : initializeApp(config, appName);
  const messaging = getMessaging(app);
  const projectFingerprint = [config.projectId, config.messagingSenderId, vapidKey, serviceWorkerScope].join(":");
  const fingerprintKey = `beige-web-push-project-v1-${appUserType}`;
  if (window.localStorage.getItem(fingerprintKey) !== projectFingerprint) {
    // Existing browser registrations can belong to an older Firebase sender.
    // Refresh once per project configuration, then keep the new token stable.
    try {
      console.info("[WebPush] Refreshing previous Firebase token", { userType: appUserType });
      await deleteToken(messaging);
    } catch (error) {
      console.warn("Could not clear the previous web push token before registration:", error);
    }
  }
  console.info("[WebPush] Requesting Firebase token", { userType: appUserType });
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return { status: "token-unavailable" as const };

  console.info("[WebPush] Registering token with web API", { userType: appUserType });
  await apiClient.post("push-notifications/tokens", {
    fcm_token: token,
    session_id: getSessionId(),
    device_type: "web",
  });
  window.localStorage.setItem(fingerprintKey, projectFingerprint);
  return { status: "registered" as const, token };
};

/**
 * Stops server-side delivery to this browser. Keep the Firebase token itself
 * intact: Firebase can reuse it when the user logs in again.
 */
export const unregisterBrowserPush = async () => {
  const sessionId = getExistingSessionId();
  if (!sessionId) return { status: "not-registered" as const };

  await apiClient.delete("push-notifications/tokens", { session_id: sessionId });
  return { status: "unregistered" as const };
};

export const listenForForegroundPush = async (userType: unknown, onPayload: (payload: MessagePayload) => void) => {
  const appUserType = resolveAppUserType(userType);
  if (!appUserType) return () => undefined;
  const { config } = getFirebaseConfig(appUserType);
  if (typeof window === "undefined" || !Object.values(config).every(Boolean) || !(await isSupported())) return () => undefined;
  const appName = getPushAppName(appUserType);
  const app = getApps().some((item) => item.name === appName) ? getApp(appName) : initializeApp(config, appName);
  return onMessage(getMessaging(app), onPayload);
};
