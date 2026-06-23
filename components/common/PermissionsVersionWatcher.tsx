"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { authApi } from "@/lib/redux/features/auth/authApi";
import { logout as logoutAction } from "@/lib/redux/features/auth/authSlice";
import { salesApi } from "@/lib/redux/features/sales/salesApi";
import { persistor } from "@/lib/redux/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export function PermissionsVersionWatcher() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isForcedLogoutOpen, setIsForcedLogoutOpen] = useState(false);
  const hasHandledUpdateRef = useRef(false);

  const authReady = Boolean(
    !isLoading &&
      isAuthenticated &&
      user &&
      token,
  );

  const [triggerGetCurrentUser] = authApi.useLazyGetCurrentUserQuery();

  useEffect(() => {
    setIsForcedLogoutOpen(false);
    hasHandledUpdateRef.current = false;
  }, [user?.id, token]);

  useEffect(() => {
    if (!authReady || isForcedLogoutOpen || hasHandledUpdateRef.current) {
      return;
    }

    const isPublicRoute =
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/signup") ||
      pathname === "/creator-signup" ||
      pathname?.startsWith("/forgot-password") ||
      pathname?.startsWith("/reset-password") ||
      pathname?.startsWith("/verify-email");

    if (isPublicRoute) {
      return;
    }

    let isActive = true;

    const runCheck = async () => {
      try {
        const result = await triggerGetCurrentUser().unwrap();
        const currentRole = String(user?.userRole ?? "").trim().toLowerCase();
        const latestRole = String((result as any)?.role ?? (result as any)?.userRole ?? "").trim().toLowerCase();

        if (!isActive) return;

        if (currentRole && latestRole && currentRole !== latestRole) {
          hasHandledUpdateRef.current = true;
          setIsForcedLogoutOpen(true);
        }
      } catch (error: any) {
        if (!isActive) return;

        const status = error?.status;
        const forceLogout = error?.data?.force_logout === true;
        const forceLogoutByMessage = error?.data?.message === "Please login again.";

        if (status === 401 || forceLogout || forceLogoutByMessage) {
          hasHandledUpdateRef.current = true;
          setIsForcedLogoutOpen(true);
          return;
        }

        if (status === 403) {
          hasHandledUpdateRef.current = true;
          setIsForcedLogoutOpen(true);
        }
      }
    };

    void runCheck();

    return () => {
      isActive = false;
    };
  }, [authReady, isForcedLogoutOpen, pathname, token, triggerGetCurrentUser, user?.userRole]);

  const handleLoginAgain = async () => {
    hasHandledUpdateRef.current = true;
    setIsForcedLogoutOpen(false);

    dispatch(authApi.util.resetApiState());
    dispatch(salesApi.util.resetApiState());
    dispatch(logoutAction());

    Cookies.remove("revure_token");
    Cookies.remove("revure_user");
    Cookies.remove("revure_permissions");

    if (typeof window !== "undefined") {
      localStorage.removeItem("revure_user");
      localStorage.removeItem("revure_permissions");
      sessionStorage.clear();
    }

    await persistor.purge();
    router.replace("/login");
  };

  if (!authReady) return null;

  return (
    <Dialog open={isForcedLogoutOpen}>
      <DialogContent
        className="w-[calc(100vw-24px)] max-w-[460px] overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0A] p-0 text-white shadow-[0_28px_90px_rgba(0,0,0,0.6)] [&>button]:hidden"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b border-white/10 px-8 py-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-[#E5D5B8]/20 bg-[#E5D5B8]/10 p-3">
                <Info className="text-[#E5D5B8]" size={20} />
              </div>
              <div>
                <DialogTitle className="text-[24px] font-bold text-white">
                  Permissions Updated
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-white/60">
                  Your role or permissions have been updated by an administrator. Please login again to continue.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-8 py-6">
          <Button
            type="button"
            onClick={handleLoginAgain}
            className="flex h-12 w-full rounded-[20px] bg-[#E5D5B8] px-5 text-sm font-bold text-black transition-all hover:bg-[#d6c29b] active:scale-[0.98]"
          >
            Login Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
