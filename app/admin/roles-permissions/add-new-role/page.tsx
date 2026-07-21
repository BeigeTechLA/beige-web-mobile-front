"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { RoleCreatePage } from "@/components/admin/roles-permissions/RoleCreatePage";
import { usePermissions } from "@/lib/hooks/usePermissions";

export default function AdminAddNewRoleRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const { canCreate, isLoading } = usePermissions("roles_permissions");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || isLoading || canCreate) return;
    router.replace("/admin/roles-permissions");
  }, [mounted, isLoading, canCreate, router]);

  if (!mounted || isLoading || !canCreate) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white/60">
        {!isLoading && mounted && !canCreate ? "No Permission" : null}
      </div>
    );
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "roles-permissions": "User Roles & Permissions Management",
          "add-new-role": "Add New Role",
        }}
      />
      <RoleCreatePage />
    </>
  );
}
