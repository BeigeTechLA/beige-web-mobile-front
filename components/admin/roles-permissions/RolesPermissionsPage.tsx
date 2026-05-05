"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import Image from "next/image";
import { permissionUsers, roleCards } from "@/components/admin/roles-permissions/data";
import { PermissionUsersTable } from "@/components/admin/roles-permissions/PermissionUsersTable";
import { RoleCard } from "@/components/admin/roles-permissions/RoleCard";

export function RolesPermissionsPage() {
  const router = useRouter();

  return (
    <div className="overflow-hidden px-4 pb-16 pt-6 lg:px-10 lg:pb-24 lg:pt-10">
      <div className="mx-auto w-full max-w-[1270px]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[610px]">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-white lg:text-[31px]">
                Roles & Permission
              </h1>
              <p className="mt-2.5 max-w-[560px] text-[14px] leading-[1.55] text-white/60 lg:text-[15px]">
                A role provided access to predefined menus and features so that
                depending on assigned role an administrator can have access to what
                user needs.
              </p>
            </div>

            <button className="inline-flex h-[62px] items-center justify-between gap-4 self-start rounded-full border border-white/20 bg-transparent px-6 text-[17px] text-white/75 transition hover:border-white/35 hover:text-white">
              <span>Sort by Date</span>
              <CalendarDays size={22} />
            </button>
          </div>

          <div className="border-t border-dashed border-white/14" />

          <div className="grid gap-5 xl:grid-cols-3">
            {roleCards.map((card) => (
              <RoleCard
                key={card.id}
                card={card}
                onEdit={() => router.push("/admin/roles-permissions/edit-details")}
              />
            ))}

            <div className="relative min-h-[214px] overflow-hidden rounded-[24px] border border-[#f0ddba33] bg-[radial-gradient(circle_at_18%_12%,_rgba(255,255,255,0.65),_transparent_24%),radial-gradient(circle_at_76%_22%,_rgba(255,255,255,0.4),_transparent_22%),linear-gradient(120deg,_#f5e2c0_0%,_#edd3a4_46%,_#f5e6cb_100%)] px-7 py-6 text-[#171717]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_32%,rgba(255,255,255,0.05)_72%,transparent)]" />
              <div className="absolute bottom-0 left-2 h-[194px] w-[182px]">
                <Image
                  src="/images/handsome-stylish-bearded-guy-posing-against-white-wall 1.png"
                  alt="Add new role"
                  fill
                  sizes="182px"
                  className="object-contain object-bottom"
                />
              </div>

              <div className="relative z-10 ml-auto flex h-full max-w-[235px] flex-col justify-center pr-1">
                <h3 className="text-[23px] font-semibold tracking-[-0.02em] text-[#171717]">
                  New Role
                </h3>
                <p className="mt-3 text-[15px] leading-[1.45] text-black/72">
                  Add new role, if it doesn&apos;t exist.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/admin/roles-permissions/add-new-role")}
                  className="mt-7 inline-flex h-12 w-fit items-center rounded-[16px] bg-[#1b1b1b] px-7 text-[15px] font-medium text-white transition hover:bg-black"
                >
                  Add New Role
                </button>
              </div>
            </div>
          </div>

          <PermissionUsersTable
            users={permissionUsers}
            onEdit={() => router.push("/admin/roles-permissions/edit-details")}
          />
        </div>
      </div>
    </div>
  );
}
