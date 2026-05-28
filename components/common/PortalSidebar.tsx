"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";
import { useTheme } from "next-themes";

import { useAuth } from "@/lib/hooks/useAuth";
import { useAppSelector } from "@/lib/redux/hooks";
import { hasModulePermission } from "@/lib/permissions";
import {
  portalLabels,
  portalSidebarItems,
  type PortalKey,
  type SidebarContextState,
  type SidebarItem,
  type SidebarItemChild,
} from "@/lib/portal-sidebar-config";

type SalesSidebarState = {
  isManagedUser: boolean;
  isSalesAvailable: boolean;
  isSalesStatusLoading: boolean;
  isRouteAllowedWhileInactive: (link?: string) => boolean;
};

type PortalSidebarProps = {
  portal: PortalKey;
  onClose?: () => void;
  salesState?: SalesSidebarState;
};

const isSalesAdminInvoiceUser = (user: Record<string, unknown> | null | undefined) => {
  if (!user) return false;

  const userTypeId = user.user_type_id ?? user.userTypeId;
  const roleValue = user.role ?? user.userRole;
  const normalizedRole = String(roleValue ?? "").trim().toLowerCase();

  return userTypeId === 7 && normalizedRole === "sales_admin";
};

const getItemClassNames = (isDark: boolean, isActive: boolean) => {
  const base = "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium";
  const active = "bg-[#E5D5B8] text-[#171717]";
  const inactive = isDark ? "text-[#676767] hover:text-white" : "text-[#676767] hover:text-[#101010]";

  return `${base} ${isActive ? active : inactive}`;
};

const childIsActive = (pathname: string, child: SidebarItemChild) => {
  if (pathname === child.link) return true;
  return child.matchStartsWith?.some((prefix) => pathname.startsWith(prefix)) ?? false;
};

const renderIcon = (item: SidebarItem, isActive: boolean) => {
  if (item.supportsActiveState) {
    return <item.icon size={20} isActive={isActive} />;
  }

  return <item.icon size={20} />;
};

export default function PortalSidebar({ portal, onClose, salesState }: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const permissions = useAppSelector((state) => state.auth.permissions);
  const initialPath = useRef(pathname);

  const [mounted, setMounted] = useState(false);
  const [localUserTypeId, setLocalUserTypeId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const normalizedUserTypeId = Number(
        parsedUser?.user_type_id ?? parsedUser?.userTypeId ?? user?.user_type_id ?? user?.userTypeId,
      );

      setLocalUserTypeId(Number.isFinite(normalizedUserTypeId) ? normalizedUserTypeId : null);
    } catch {
      setLocalUserTypeId(null);
    }
  }, [user]);

  useEffect(() => {
    if (onClose && pathname !== initialPath.current) {
      onClose();
    }
  }, [pathname, onClose]);

  const isDark = !mounted || theme === "dark";
  const normalizedUserTypeId = Number(user?.user_type_id ?? user?.userTypeId ?? localUserTypeId);
  const currentUserTypeId = Number.isFinite(normalizedUserTypeId) ? normalizedUserTypeId : null;
  const contextState: SidebarContextState = {
    currentUserTypeId,
    isSalesAdmin: isSalesAdminInvoiceUser(user as Record<string, unknown> | null | undefined),
  };

  const isRouteDisabled = (link?: string) =>
    Boolean(
      portal === "sales" &&
        link &&
        salesState?.isManagedUser &&
        !salesState.isSalesStatusLoading &&
        !salesState.isSalesAvailable &&
        !salesState.isRouteAllowedWhileInactive(link),
    );

  const visibleItems = useMemo(() => {
    return portalSidebarItems[portal].filter((item) => {
      if (item.permissionKeys?.length) {
        const canView = hasModulePermission(permissions, item.permissionKeys, item.permissionAction ?? "view");
        if (!canView) return false;
      }

      if (!item.visibleForUserTypes?.length) return true;

      return currentUserTypeId != null && item.visibleForUserTypes.includes(currentUserTypeId);
    });
  }, [currentUserTypeId, permissions, portal]);

  const getVisibleChildren = (item: SidebarItem) => {
    if (!item.children?.length) return [];

    return item.children.filter((child) => {
      if (child.visibleForUserTypes?.length) {
        if (currentUserTypeId == null || !child.visibleForUserTypes.includes(currentUserTypeId)) {
          return false;
        }
      }

      return child.isVisible ? child.isVisible(contextState) : true;
    });
  };

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);

      visibleItems.forEach((item) => {
        const visibleChildren = getVisibleChildren(item);
        const shouldExpand =
          visibleChildren.some((child) => childIsActive(pathname, child)) ||
          (item.link ? pathname === item.link || pathname.startsWith(`${item.link}/`) : false);

        if (shouldExpand && visibleChildren.length > 0) {
          next.add(item.name);
        }
      });

      return Array.from(next);
    });
  }, [pathname, visibleItems]);

  const handleNavigation = (link?: string) => {
    if (!link || link === "#" || isRouteDisabled(link)) return;
    router.push(link);
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  const isActiveLink = (link?: string) => {
    if (!link || link === "#") return false;
    if (pathname === link) return true;

    const dashboardLinks = [
      "/admin/dashboard",
      "/sales/dashboard",
      "/production-manager/dashboard",
      "/affiliate/dashboard",
    ];

    if (dashboardLinks.includes(link)) {
      return false;
    }

    return pathname.startsWith(link);
  };

  const isParentActive = (item: SidebarItem, children: SidebarItemChild[]) => {
    if (children.length > 0) {
      return children.some((child) => childIsActive(pathname, child)) || isActiveLink(item.link);
    }

    return isActiveLink(item.link);
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    if (onClose) onClose();
    router.push("/");
  };

  return (
    <aside
      className={`w-full lg:w-64 border-r flex flex-col justify-between py-6 lg:py-9 px-5 h-full overflow-hidden transition-colors duration-100 ${
        isDark
          ? "border-zinc-800 bg-[#0A0A0A]"
          : "border-[#D8D8D8] bg-white shadow-[0_8px_24px_0_rgba(149,157,165,0.10)]"
      }`}
    >
      <div className="flex items-center justify-between lg:justify-center mb-8">
        <Link href="/" className="relative flex items-center">
          <Image
            src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={100}
            height={20}
          />
          <span
            className={`absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full border backdrop-blur-xs overflow-hidden ${
              isDark
                ? "text-white border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)]"
                : "text-black border-black/20 shadow-sm"
            }`}
          >
            Beta
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
          </span>
        </Link>
        <button
          onClick={onClose}
          className={`lg:hidden p-2 rounded-full ${isDark ? "bg-zinc-900 text-white" : "bg-zinc-100 text-black"}`}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 pr-2 no-scrollbar">
        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const visibleChildren = getVisibleChildren(item);
            const hasChildren = visibleChildren.length > 0;
            const isExpanded = expanded.includes(item.name);
            const active = isParentActive(item, visibleChildren);
            const allChildrenDisabled =
              hasChildren && visibleChildren.every((child) => isRouteDisabled(child.link));
            const isDisabled = (!hasChildren && isRouteDisabled(item.link)) || allChildrenDisabled;

            return (
              <div key={item.key}>
                {hasChildren ? (
                  <button
                    onClick={() => !isDisabled && toggleExpand(item.name)}
                    className={`${getItemClassNames(isDark, active)} ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {renderIcon(item, active)}
                      <span className="min-w-0 truncate text-left font-medium whitespace-nowrap">
                        {item.name}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : isDisabled ? (
                  <div
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed select-none opacity-30 ${
                      isDark ? "text-zinc-200" : "text-zinc-700"
                    }`}
                  >
                    {renderIcon(item, active)}
                    <span className="font-medium">{item.name}</span>
                  </div>
                ) : (
                  <button onClick={() => handleNavigation(item.link)} className={getItemClassNames(isDark, active)}>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {renderIcon(item, active)}
                      <span className="min-w-0 truncate text-left font-medium whitespace-nowrap">
                        {item.name}
                      </span>
                    </div>
                  </button>
                )}

                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-zinc-800 pl-4 space-y-1">
                    {visibleChildren.map((child) => {
                      const activeChild = childIsActive(pathname, child);
                      const childDisabled = isRouteDisabled(child.link);

                      return (
                        <button
                          key={child.key}
                          onClick={() => handleNavigation(child.link)}
                          disabled={childDisabled}
                          className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            activeChild
                              ? isDark
                                ? "text-white font-medium"
                                : "text-[#101010] font-bold"
                              : isDark
                                ? "text-zinc-500 hover:text-gray-300"
                                : "text-[#00000066] hover:text-[#101010]"
                          }`}
                        >
                          {child.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className={`pt-6 border-t flex-shrink-0 transition-colors ${isDark ? "border-white/10 bg-[#0A0A0A]" : "border-zinc-200 bg-white"}`}>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E5D5B8] to-[#C4A470] flex items-center justify-center text-black font-bold text-lg shrink-0">
            {user?.name?.[0] || portalLabels[portal][0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#101010]"}`}>
              {user?.name || portalLabels[portal]}
            </p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg ${
            isDark ? "text-[#171717] bg-[#FFFFFF]" : "text-[#FFFFFF] bg-[#171717]"
          } transition-colors text-sm font-medium`}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
