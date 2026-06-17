"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

const normalizeVersion = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function PermissionsVersionWatcher() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isForcedLogoutOpen, setIsForcedLogoutOpen] = useState(false);
  const baselineVersionRef = useRef<number | null>(null);
  const hasHandledUpdateRef = useRef(false);
  const sessionKeyRef = useRef<string>("");

  const permissionsVersion = useMemo(
    () => normalizeVersion(user?.permissions_version),
    [user?.permissions_version],
  );

  const authReady = Boolean(
    !isLoading &&
      isAuthenticated &&
      user &&
      token &&
      permissionsVersion !== null,
  );

  const queryResult = authApi.useGetCurrentUserQuery(undefined, {
    skip: !authReady || isForcedLogoutOpen || hasHandledUpdateRef.current,
    pollingInterval: authReady && !isForcedLogoutOpen && !hasHandledUpdateRef.current ? 2000 : 0,
    refetchOnMountOrArgChange: true,
  });

  const latestVersion = normalizeVersion(queryResult.data?.permissions_version);
  const queryError = queryResult.error as
    | {
        status?: number;
        data?: {
          force_logout?: boolean;
          message?: string;
        };
      }
    | undefined;
  const forceLogoutRequested =
    queryError?.status === 401 || queryError?.data?.force_logout === true;

  useEffect(() => {
    const nextSessionKey = authReady ? `${user?.id ?? "unknown"}:${token ?? "no-token"}` : "";
    if (sessionKeyRef.current !== nextSessionKey) {
      sessionKeyRef.current = nextSessionKey;
      baselineVersionRef.current = null;
      setIsForcedLogoutOpen(false);
      hasHandledUpdateRef.current = false;
    }
  }, [authReady, token, user?.id]);

  useEffect(() => {
    if (!authReady || isForcedLogoutOpen || hasHandledUpdateRef.current) return;

    if (forceLogoutRequested) {
      hasHandledUpdateRef.current = true;
      setIsForcedLogoutOpen(true);
      return;
    }

    if (latestVersion === null) return;

    if (baselineVersionRef.current === null) {
      baselineVersionRef.current = latestVersion;
      return;
    }

    if (baselineVersionRef.current !== latestVersion) {
      hasHandledUpdateRef.current = true;
      setIsForcedLogoutOpen(true);
    }
  }, [authReady, forceLogoutRequested, isForcedLogoutOpen, latestVersion]);

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
