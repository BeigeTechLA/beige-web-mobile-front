"use client";

import React from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Lock } from "lucide-react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

interface PermissionGuardProps {
  module: string;
  action?: "view" | "create" | "edit" | "delete";
  fallback?: React.ReactNode;
  children: React.ReactNode;
  hideEntirely?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action = "view",
  fallback,
  children,
  hideEntirely = false,
}) => {
  const perms = usePermissions(module);
  const {isDark} = useResolvedTheme();

  let hasPermission = false;
  if (action === "view") hasPermission = perms.canView;
  else if (action === "create") hasPermission = perms.canCreate;
  else if (action === "edit") hasPermission = perms.canEdit;
  else if (action === "delete") hasPermission = perms.canDelete;

  if (perms.isLoading) {
    return null;
  }

  if (!hasPermission) {
    if (hideEntirely || action !== "view") {
      return null;
    }

    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[400px] rounded-2xl border backdrop-blur-md ${isDark ? "border-white/10 bg-black/40":"border-black/10 bg-white/40"}`}>
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? "text-white":"text-black"}`}>Access Denied</h3>
        <p className={`text-sm max-w-md ${isDark ? "text-white/60":"text-black/60"}`}>
          You do not have permission to view this section ({module}). Please contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
