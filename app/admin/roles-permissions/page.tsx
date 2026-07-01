"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { RolesPermissionsPage } from "@/components/admin/RolesPermissionsPage";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function AdminRolesPermissionsRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { canCreate } = usePermissions("roles_permissions");
  const { canCreate: canCreateUser } = usePermissions("users");

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = resolvedTheme ?? theme;
  const isDark = !mounted || activeTheme === "dark";

  return (
    <PermissionGuard module="roles_permissions" action="view">
      <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "roles-permissions": "User Roles & Permissions Management",
        }}
        actions={
          <>
            <div
              className={`hidden xl:flex items-center h-12 flex-1 min-w-[280px] max-w-[420px] rounded-xl border px-4 transition-colors ${
                isDark
                  ? "border-white/10 bg-[#202020] text-white/70"
                  : "border-[#E3E3E3] bg-white text-[#323232]"
              }`}
            >
              <Search size={18} className={`mr-3 ${isDark ? "text-white/40" : "text-[#32323266]"}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className={`w-full bg-transparent text-sm focus:outline-none ${
                  isDark ? "text-white placeholder:text-white/35" : "text-[#323232] placeholder:text-[#32323266]"
                }`}
              />
            </div>

            {/* Export button intentionally commented out for now */}
            {/* <Button className="h-12 rounded-xl border border-white/10 bg-[#202020] px-5 text-white hover:bg-white/10">
              <ArrowUpToLine size={18} />
              Export
            </Button> */}
            <Button
              onClick={() => router.push("/admin/roles-permissions/add-new-role")}
              disabled={!canCreate}
              title={canCreate ? "Add New Role" : "Create permission not allowed"}
              className="h-12 shrink-0 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#d8c6a4]"
            >
              <Plus size={18} />
              Add New Role
            </Button>

            <Button
              onClick={() => router.push("/admin/internal-credentials")}
              disabled={!canCreateUser}
              title={canCreateUser ? "Add New User" : "Create permission not allowed"}
              className="h-12 shrink-0 rounded-xl bg-[#E5D5B8] px-5 text-black hover:bg-[#d8c6a4]"
            >
              <Plus size={18} />
              Add New User
            </Button>
          </>
        }
      />

      <RolesPermissionsPage searchQuery={searchQuery} />
      </>
    </PermissionGuard>
  );
}
