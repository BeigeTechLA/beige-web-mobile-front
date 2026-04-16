"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { salesApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  canManageLiveSalesStatus,
  parseSalesAvailabilityStatus,
} from "@/lib/sales-status";

type SalesStatusContextValue = {
  isManagedUser: boolean;
  isSalesAvailable: boolean;
  unavailableReason: string;
  isLoading: boolean;
  isUpdating: boolean;
  setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  setSalesStatus: (nextStatus: { isAvailable: boolean; reason?: string }) => void;
  refreshStatus: () => Promise<void>;
};

const SalesStatusContext = createContext<SalesStatusContextValue | undefined>(
  undefined
);

export const SalesStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, token } = useAuth();
  const isManagedUser = canManageLiveSalesStatus(user);
  const [isSalesAvailable, setIsSalesAvailable] = useState(true);
  const [unavailableReason, setUnavailableReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const setSalesStatus = useCallback(
    ({
      isAvailable,
      reason = "",
    }: {
      isAvailable: boolean;
      reason?: string;
    }) => {
      setIsSalesAvailable(isAvailable);
      setUnavailableReason(isAvailable ? "" : reason.trim());
    },
    []
  );

  const refreshStatus = useCallback(async () => {
    if (!token || !isManagedUser) {
      setIsLoading(false);
      setSalesStatus({ isAvailable: true, reason: "" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await salesApi.getCurrentSalesStatus();

      if (response?.success === false && response?.error) {
        throw new Error(response.error);
      }

      setSalesStatus(parseSalesAvailabilityStatus(response));
    } catch (error) {
      console.error("Failed to fetch current sales status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isManagedUser, setSalesStatus, token]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!token || !isManagedUser) {
      return;
    }

    const handleFocus = () => {
      void refreshStatus();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshStatus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isManagedUser, refreshStatus, token]);

  const value = useMemo(
    () => ({
      isManagedUser,
      isSalesAvailable,
      unavailableReason,
      isLoading,
      isUpdating,
      setIsUpdating,
      setSalesStatus,
      refreshStatus,
    }),
    [
      isManagedUser,
      isSalesAvailable,
      unavailableReason,
      isLoading,
      isUpdating,
      setSalesStatus,
      refreshStatus,
    ]
  );

  return (
    <SalesStatusContext.Provider value={value}>
      {children}
    </SalesStatusContext.Provider>
  );
};

export const useSalesStatus = () => {
  const context = useContext(SalesStatusContext);

  if (!context) {
    throw new Error("useSalesStatus must be used within a SalesStatusProvider");
  }

  return context;
};
