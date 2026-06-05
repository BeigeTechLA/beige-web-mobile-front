"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Camera, LogOut, Calendar, X, ChevronDown, type LucideIcon, Receipt, FolderOpen, CalendarClock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useSalesStatus } from "@/context/SalesStatusContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { isSalesRouteAllowedWhileInactive } from "@/lib/sales-status";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useAppSelector } from '@/lib/redux/hooks';
import { hasModulePermission } from '@/lib/permissions';

const CustomQuotesIcon = ({ size = 24, isActive = false, ...props }) => {
  const inactiveIcon = '/images/misc/Quotes.svg';
  const activeIcon = '/images/misc/QuotesActive.svg';

  return (
    <div
      {...props}
      style={{
        width: size,
        height: size,
        ...(isActive
          ? {
            // ACTIVE STATE: Normal background image (shows original SVG colors)
            backgroundImage: `url('${activeIcon}')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
          }
          : {
            // INACTIVE STATE: Masking effect (inherits currentColor/gray)
            backgroundColor: 'currentColor',
            WebkitMaskImage: `url('${inactiveIcon}')`,
            maskImage: `url('${inactiveIcon}')`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }),
      }}
    />
  );
};

const salesMenuItems: SalesMenuItem[] = [
  {
    name: 'Sales',
    icon: LayoutDashboard,
    link: '/sales/dashboard',
    permissionKeys: ['sales_admin_dashboard', 'sales_rep_sales', 'dashboard'],
    children: [
      { name: 'Dashboard', link: '/sales/dashboard', visibleForUserTypes: [7], permissionKeys: ['sales_admin_dashboard', 'dashboard'] },
      { name: 'Sales People', link: '/sales/sales-people', visibleForUserTypes: [7], permissionKeys: ['sales_admin_sales_people', 'users'] },
    ],
  },
  { name: 'Availability', icon: Calendar, link: '/sales/availability', permissionKeys: ['sales_rep_availability', 'availability'], visibleForUserTypes: [5] },
  { name: 'Shoots', icon: Camera, link: '/sales/shoots', permissionKeys: ['sales_rep_shoots', 'sales_admin_shoots', 'shoots'] },
  { name: 'File Manager', icon: FolderOpen, link: '/sales/file-manager', permissionKeys: ['sales_rep_file_manager', 'sales_admin_file_manager', 'file_manager'] },
  { name: 'Meetings', icon: CalendarClock, link: '/sales/meetings', permissionKeys: ['sales_rep_meetings', 'sales_admin_meetings', 'meetings'] },
  { name: 'Messages', icon: MessageCircle, link: '/sales/messages', permissionKeys: ['sales_rep_messages', 'sales_admin_messages', 'messages'] },
  {
    name: 'Quotes',
    icon: CustomQuotesIcon,
    link: '/sales/quotes',
    permissionKeys: ['sales_rep_quotes', 'sales_admin_quotes', 'quotes'],
    children: [
      { name: 'All Quotes', link: '/sales/quotes', permissionKeys: ['sales_rep_quotes', 'sales_admin_quotes', 'quotes'] },
      { name: 'Change Request', link: '/sales/quotes/change-requests', permissionKeys: ['sales_admin_quotes', 'quotes'] },
      { name: 'Master Pricing', link: '/sales/quotes/pricing', permissionKeys: ['sales_admin_quotes', 'quotes'] }
    ],
  },



  { name: 'Invoices', icon: Receipt, link: '/sales/invoice', permissionKeys: ['sales_admin_invoices', 'invoices'], visibleForUserTypes: [7] },
];

type SalesMenuItem = {
  name: string;
  icon: LucideIcon;
  link?: string;
  isDisabled?: boolean;
  visibleForUserTypes?: number[];
  permissionKeys?: string[];
  children?: {
    name: string;
    link: string;
    isDisabled?: boolean;
    visibleForUserTypes?: number[];
    permissionKeys?: string[];
  }[];
};

// const isSalesAdminInvoiceUser = (user: Record<string, unknown> | null | undefined) => {
//   if (!user) return false;

//   const userTypeId = user.user_type_id ?? user.userTypeId;
//   const roleValue = user.role ?? user.userRole;
//   const normalizedRole = String(roleValue ?? "").trim().toLowerCase();

//   return userTypeId === 7 && normalizedRole === "sales_admin";
// };

const isSalesAdminInvoiceUser = (user: Record<string, unknown> | null | undefined) => {
  if (!user) return false;

  const userTypeId = user.user_type_id ?? user.userTypeId;
  const roleValue = user.role ?? user.userRole;
  const normalizedRole = String(roleValue ?? "").trim().toLowerCase();

  return userTypeId === 7 && normalizedRole === "sales_admin";
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const {
    isManagedUser,
    isSalesAvailable,
    isLoading: isSalesStatusLoading,
  } = useSalesStatus();
  const permissions = useAppSelector((state) => state.auth.permissions);

  const initialPath = useRef(pathname);

  const [mounted, setMounted] = useState(false);
  const [quotesExpanded, setQuotesExpanded] = useState(false);
  const [localUserTypeId, setLocalUserTypeId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const normalizedUserTypeId = Number(
        parsedUser?.user_type_id ?? parsedUser?.userTypeId ?? user?.user_type_id ?? user?.userTypeId
      );

      setLocalUserTypeId(Number.isFinite(normalizedUserTypeId) ? normalizedUserTypeId : null);
    } catch {
      setLocalUserTypeId(null);
    }
  }, [user]);

  useEffect(() => {
    // Only trigger onClose if the current pathname is different 
    // from the one we had when the sidebar opened.
    if (onClose && pathname !== initialPath.current) {
      onClose();
    }
  }, [pathname, onClose]);

  const isDark = !mounted || theme === "dark";
  const normalizedUserTypeId = Number(user?.user_type_id ?? user?.userTypeId ?? localUserTypeId);
  const currentUserTypeId = Number.isFinite(normalizedUserTypeId) ? normalizedUserTypeId : null;
  const isSalesAdmin = isSalesAdminInvoiceUser(user as Record<string, unknown> | null | undefined);
  const visibleSalesMenuItems = salesMenuItems.filter((item) => {
    if (item.permissionKeys && item.permissionKeys.length > 0) {
      const canView = hasModulePermission(permissions, item.permissionKeys, "view");
      if (!canView) return false;
    }

    if (!item.visibleForUserTypes?.length) {
      return true;
    }

    return currentUserTypeId != null && item.visibleForUserTypes.includes(currentUserTypeId);
  });

  useEffect(() => {
    if (currentUserTypeId !== 7) {
      return;
    }

    if (pathname === "/sales/dashboard" || pathname?.startsWith("/sales/sales-people")) {
      setExpanded((prev) => (prev.includes("Sales") ? prev : [...prev, "Sales"]));
    }

    if (pathname?.startsWith("/sales/quotes")) {
      setQuotesExpanded(true);
    }
  }, [currentUserTypeId, pathname]);

  const getVisibleChildren = (item: SalesMenuItem) => {
    if (!item.children?.length) {
      return [];
    }

    return item.children.filter((child) => {
      if (child.permissionKeys?.length && !hasModulePermission(permissions, child.permissionKeys, "view")) {
        return false;
      }

      if (!child.visibleForUserTypes?.length) {
        return true;
      }

      return currentUserTypeId != null && child.visibleForUserTypes.includes(currentUserTypeId);
    });
  };

  // Shared helper to handle navigation and closing sidebar
  const isRouteDisabled = (link?: string) =>
    Boolean(
      link &&
      isManagedUser &&
      !isSalesStatusLoading &&
      !isSalesAvailable &&
      !isSalesRouteAllowedWhileInactive(link)
    );

  const handleNavigation = (link: string) => {
    if (link && link !== "#" && !isRouteDisabled(link)) {
      router.push(link);
    }
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };

  const isActiveLink = (link?: string) => {
    if (!link || link === "#") return false;

    if (link === "/sales/dashboard") {
      return pathname === link;
    }

    return (
      pathname === link ||
      (link !== "/sales/dashboard" && pathname?.startsWith(link))
    );
  };

  const isChildActive = (parentName: string, link?: string) => {
    if (!link || link === "#") return false;

    if (parentName === "Sales" && link === "/sales/dashboard") {
      return pathname === "/sales/dashboard";
    }

    return isActiveLink(link);
  };

  const isParentActive = (item: SalesMenuItem) => {
    const visibleChildren = getVisibleChildren(item);

    if (visibleChildren.length > 0) {
      return visibleChildren.some((child) => isChildActive(item.name, child.link));
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
    <aside className={`
      w-full lg:w-64 border-r flex flex-col justify-between py-6 lg:py-9 px-5 h-full overflow-hidden transition-colors duration-100
      ${isDark
        ? "border-zinc-800 bg-[#0A0A0A]"
        : "border-[#D8D8D8] bg-white shadow-[0_8px_24px_0_rgba(149,157,165,0.10)]"
      }
    `}>
      {/* Mobile Header with Logo and Close Button */}
      <div className="flex items-center justify-between lg:justify-center mb-8">
        <Link href="/" className="relative flex items-center">
          <Image
            src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png"
            alt="BEIGE"
            width={100}
            height={20}
          />
          {/* Beta Tag */}
          <span className={`absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full border backdrop-blur-xs overflow-hidden ${isDark ? "text-white border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)]" : "text-black border-black/20 shadow-sm"
            }`}>
            Beta
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-40 -translate-x-full animate-shimmer" />
          </span>
        </Link>
        <button onClick={onClose} className={`lg:hidden p-2 rounded-full ${isDark ? "bg-zinc-900 text-white" : "bg-zinc-100 text-black"}`}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 pr-2 no-scrollbar">
        <nav className="space-y-2">
          {visibleSalesMenuItems.map((item) => {
            const visibleChildren = getVisibleChildren(item);
            const hasChildren = currentUserTypeId === 7 && visibleChildren.length > 0;
            const isExpanded = expanded.includes(item.name);
            const active = isParentActive(item);
            const isDisabled =
              Boolean(item.isDisabled) ||
              (!hasChildren && isRouteDisabled(item.link)) ||
              (hasChildren &&
                visibleChildren.length > 0 &&
                visibleChildren.every((child) => Boolean(child.isDisabled) || isRouteDisabled(child.link)));

            const baseClass = `w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium`;
            const activeClass = "bg-[#E5D5B8] text-[#171717]";
            const inactiveClass = isDark ? "text-[#676767] hover:text-white" : "text-[#676767] hover:text-[#101010]";

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => !isDisabled && toggleExpand(item.name)}
                    className={`${baseClass} ${active ? activeClass : inactiveClass} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <item.icon size={20} {...(item.name === 'Quotes' ? { isActive: active } : {})} />
                      <span className="min-w-0 truncate text-left font-medium whitespace-nowrap">
                        {item.name}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : isDisabled ? (
                  /* Render a DIV instead of a LINK if disabled */
                  <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-not-allowed select-none opacity-30 ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
                    <div className="flex items-center gap-3">
                      <item.icon size={20} {...(item.name === 'Quotes' ? { isActive: active } : {})} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </div>
                ) : item.name === 'Quotes' && item.children && user?.user_type_id === 7 ? (

                  <button
                    onClick={() => setQuotesExpanded((p) => !p)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium ${active
                      ? "bg-[#E5D5B8] text-[#171717]"
                      : isDark ? "text-[#676767] hover:text-white" : "text-[#676767] hover:text-[#101010]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${quotesExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigation(item.link || '#')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${active
                      ? "bg-[#E5D5B8] text-[#171717]"
                      : isDark ? "text-[#676767] hover:text-white" : "text-[#676767] hover:text-[#101010]"
                      }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <item.icon size={20} {...(item.name === 'Quotes' ? { isActive: active } : {})} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </button>
                )}

                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-zinc-800 pl-4 space-y-1">
                    {visibleChildren.map((child) => {
                      const childActive = isChildActive(item.name, child.link);
                      const childDisabled = Boolean(child.isDisabled) || isRouteDisabled(child.link);
                      return (
                        <button
                          key={child.name}
                          onClick={() => handleNavigation(child.link)}
                          disabled={childDisabled}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${childActive
                            ? (isDark ? "text-white font-medium" : "text-[#101010] font-bold")
                            : (isDark ? "text-zinc-500 hover:text-gray-300" : "text-[#00000066] hover:text-[#101010]")
                            }`}
                        >
                          {child.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {item.name === 'Quotes' && item.children && quotesExpanded && user?.user_type_id === 7 && (
                  <div className="mt-1 ml-4 border-l border-zinc-800 pl-4 space-y-1">
                    {visibleChildren.map((child) => {
                      if ((child.name === 'Master Pricing' || child.name === 'Change Request') && !isSalesAdmin) return null;

                      return (
                        <button
                          key={child.name}
                          onClick={() => handleNavigation(child.link)}
                          className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${pathname === child.link
                            ? isDark ? "text-white font-medium" : "text-[#101010] font-bold"
                            : isDark ? "text-zinc-500 hover:text-gray-300" : "text-[#00000066] hover:text-[#101010]"
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

      {/* User Profile and Logout */}
      <div className={`pt-6 border-t flex-shrink-0 transition-colors ${isDark ? "border-white/10 bg-[#0A0A0A]" : "border-zinc-200 bg-white"}`}>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E5D5B8] to-[#C4A470] flex items-center justify-center text-black font-bold text-lg shrink-0">
            {user?.name?.[0] || "S"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#101010]"}`}>{user?.name || "Sales User"}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg ${isDark ? "text-[#171717] bg-[#FFFFFF]" : "text-[#FFFFFF] bg-[#171717]"} transition-colors text-sm font-medium`}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
