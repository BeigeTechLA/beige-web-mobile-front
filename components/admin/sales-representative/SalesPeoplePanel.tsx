"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound } from "lucide-react";

type SalesPerson = {
  id: number | string;
  name: string;
  email: string;
  user_type?: number | string;
  status?: string;
  is_active?: number | boolean;
};

interface SalesPeoplePanelProps {
  salesPeople: SalesPerson[];
  loading: boolean;
  searchQuery: string;
  isDark: boolean;
  detailBasePath: string;
}

const resolveRepStatus = (rep: SalesPerson) => {
  const normalizedStatus = rep.status?.trim().toLowerCase();

  if (normalizedStatus === "active" || normalizedStatus === "inactive") {
    return normalizedStatus;
  }

  if (rep.is_active === undefined) {
    return "active";
  }

  return rep.is_active === true || Number(rep.is_active) === 1 ? "active" : "inactive";
};

const getStatusMeta = (rep: SalesPerson, isDark: boolean) => {
  if (resolveRepStatus(rep) === "active") {
    return {
      label: "Active",
      className: isDark
        ? "border border-[#23442C] bg-[#15231A] text-[#89E29B]"
        : "border border-[#BFE5C8] bg-[#ECFDF3] text-[#166534]",
    };
  }

  return {
    label: "Inactive",
    className: isDark
      ? "border border-[#5C2A2A] bg-[#2A1717] text-[#F2A6A6]"
      : "border border-[#F3C6C6] bg-[#FEF2F2] text-[#B42318]",
  };
};

export default function SalesPeoplePanel({
  salesPeople,
  loading,
  searchQuery,
  isDark,
  detailBasePath,
}: SalesPeoplePanelProps) {
  const router = useRouter();

  const filteredSalesPeople = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return salesPeople;

    return salesPeople.filter((rep) =>
      [rep.name, rep.email, String(rep.id), getStatusMeta(rep, isDark).label]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [salesPeople, searchQuery, isDark]);

  const handleOpenDetails = (rep: SalesPerson) => {
    router.push(`${detailBasePath}/${rep.id}`);
  };

  return (
    <div className={`overflow-hidden rounded-2xl border transition-colors ${isDark ? "border-[#333] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
      <div className={`hidden lg:block overflow-x-auto ${isDark ? "bg-[#171717]" : "bg-white"}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-sm ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-black"}`}>
              <th className="py-5 px-6 font-medium">Rep ID</th>
              <th className="py-5 px-6 font-medium">Sales Person</th>
              <th className="py-5 px-6 font-medium">Email</th>
              <th className="py-5 px-6 font-medium">Status</th>
              <th className="py-5 px-6 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <Loader2 className={`inline animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
                </td>
              </tr>
            ) : filteredSalesPeople.length === 0 ? (
              <tr>
                <td colSpan={5} className={`py-20 text-center ${isDark ? "text-white/50" : "text-black/50"}`}>
                  No sales people found.
                </td>
              </tr>
            ) : (
              filteredSalesPeople.map((rep) => (
                (() => {
                  const status = getStatusMeta(rep, isDark);

                  return (
                    <tr
                      key={rep.id}
                      className={`border-t cursor-pointer transition-colors ${isDark ? "border-[#222] hover:bg-white/[0.02]" : "border-[#EAEAEA] hover:bg-black/[0.015]"}`}
                      onClick={() => handleOpenDetails(rep)}
                    >
                      <td className={`py-5 px-6 text-sm ${isDark ? "text-white/55" : "text-[#666]"}`}>#{rep.id}</td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isDark ? "bg-[#E5D5B8] text-black" : "bg-[#F2E2C3] text-black"}`}>
                            <UserRound size={18} />
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{rep.name || "Unnamed"}</p>
                            <p className={`text-xs ${isDark ? "text-white/45" : "text-[#888]"}`}>Sales account</p>
                          </div>
                        </div>
                      </td>
                      <td className={`py-5 px-6 text-sm ${isDark ? "text-white/80" : "text-[#333]"}`}>{rep.email || "No email"}</td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDetails(rep);
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D9C7A6]" : "bg-[#E8D1AB] text-black hover:bg-[#DFC79F]"}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })()
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 lg:hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
          </div>
        ) : filteredSalesPeople.length === 0 ? (
          <div className={`rounded-xl border px-4 py-8 text-center text-sm ${isDark ? "border-[#2A2A2A] text-white/50" : "border-[#E5E5E5] text-black/50"}`}>
            No sales people found.
          </div>
        ) : (
          filteredSalesPeople.map((rep) => (
            (() => {
              const status = getStatusMeta(rep, isDark);

              return (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => handleOpenDetails(rep)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${isDark ? "border-[#2A2A2A] bg-[#111] hover:border-[#E5D5B8]/30" : "border-[#E8E8E8] bg-[#FCFCFC] hover:border-[#D7BC8A]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{rep.name || "Unnamed"}</p>
                      <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-[#777]"}`}>#{rep.id}</p>
                      <p className={`mt-2 truncate text-sm ${isDark ? "text-white/75" : "text-[#444]"}`}>{rep.email || "No email"}</p>
                      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-[#E5D5B8] text-black" : "bg-[#F1DEBB] text-black"}`}>
                      View
                    </span>
                  </div>
                </button>
              );
            })()
          ))
        )}
      </div>
    </div>
  );
}
