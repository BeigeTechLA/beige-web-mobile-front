"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  PermissionColumnKey,
  PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";

type PermissionMatrixTableProps = {
  rows: PermissionMatrixRow[];
  onChange?: (rows: PermissionMatrixRow[]) => void;
  showSelectionColumn?: boolean;
  className?: string;
  readOnly?: boolean;
  onReadOnlyClick?: () => void;
};

const accessColumns: { key: PermissionColumnKey; label: string }[] = [
  { key: "view", label: "View Access" },
  { key: "create", label: "Create Access" },
  { key: "edit", label: "Edit Access" },
  { key: "delete", label: "Delete Access" },
];

export function PermissionMatrixTable({
  rows,
  onChange,
  showSelectionColumn = false,
  className = "",
  readOnly = false,
  onReadOnlyClick,
}: PermissionMatrixTableProps) {
  const { isDark } = useResolvedTheme();

  const toggleSelection = (rowId: string, checked: boolean) => {
    if (readOnly) return;
    onChange?.(
      rows.map((row) => {
        if (row.id === rowId) {
          const newAccess = { ...row.access };
          const actionsToToggle = row.allowedActions || accessColumns.map((c) => c.key);

          actionsToToggle.forEach((action) => {
            newAccess[action] = checked;
          });

          return {
            ...row,
            selected: checked,
            access: newAccess,
          };
        }
        return row;
      }),
    );
  };

  const toggleAccess = (
    rowId: string,
    key: PermissionColumnKey,
    checked: boolean,
  ) => {
    if (readOnly) {
      onReadOnlyClick?.();
      return;
    }

    onChange?.(
      rows.map((row) => {
        if (row.id === rowId) {
          const updatedAccess = { ...row.access, [key]: checked };
          const actionsToCheck = row.allowedActions || accessColumns.map((c) => c.key);

          // Any non-view permission depends on view access.
          if (checked && key !== "view") {
            updatedAccess.view = true;
          }

          if (key === "view") {
            actionsToCheck.forEach((action) => {
              updatedAccess[action] = checked;
            });
          }
          const allAllowedChecked = actionsToCheck.every((action) => updatedAccess[action]);

          return {
            ...row,
            access: updatedAccess,
            selected: allAllowedChecked,
          };
        }
        return row;
      }),
    );
  };

  const allSelected = rows.length > 0 && rows.every((row) => row.selected);

  const toggleAllRows = (checked: boolean) => {
    if (readOnly) return;
    onChange?.(
      rows.map((row) => {
        const updatedAccess = { ...row.access };
        const actionsToToggle = row.allowedActions || accessColumns.map((c) => c.key);

        actionsToToggle.forEach((action) => {
          updatedAccess[action] = checked;
        });

        return {
          ...row,
          selected: checked,
          access: updatedAccess,
        };
      }),
    );
  };

  return (
    <div
      className={`overflow-hidden rounded-[32px] ${
        isDark ? "border border-[#333] bg-[#111]" : "border border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)]"
      } ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">
          <thead>
            <tr
              className={`text-left text-[14px] font-semibold uppercase tracking-wider ${
                isDark ? "text-[#D9C8A3]/60" : "text-[#32323299]"
              }`}
            >
              {showSelectionColumn ? (
                <th className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(value) => toggleAllRows(value === true)}
                      disabled={readOnly}
                      className={`h-5 w-5 rounded-md bg-transparent disabled:cursor-not-allowed ${
                        isDark
                          ? "border-white/20 data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                          : "border-[#D0D0D0] data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E] data-[state=checked]:text-white"
                      }`}
                    />
                    <span>Select All</span>
                  </div>
                </th>
              ) : (
                <th className="px-6 py-8 font-semibold">Access To</th>
              )}
              {showSelectionColumn ? (
                <th className="px-6 py-8 font-semibold">Access To</th>
              ) : null}
              {accessColumns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-8 text-center font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={`divide-y ${isDark ? "divide-[#333]" : "divide-[#E3E3E3]"}`}>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`group transition-colors ${
                  isDark ? "text-white hover:bg-white/[0.02]" : "text-[#101010] hover:bg-black/[0.015]"
                }`}
              >
                {showSelectionColumn ? (
                  <td className="px-6 py-6">
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={(value) =>
                        toggleSelection(row.id, value === true)
                      }
                      disabled={readOnly}
                      className={`h-5 w-5 rounded-md bg-transparent disabled:cursor-not-allowed ${
                        isDark
                          ? "border-white/20 data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                          : "border-[#D0D0D0] data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E] data-[state=checked]:text-white"
                      }`}
                    />
                  </td>
                ) : null}

                <td
                  className={`px-6 py-8 text-[16px] font-medium transition-colors ${
                    isDark ? "group-hover:text-[#E5D5B8]" : "group-hover:text-[#8E6A2A]"
                  }`}
                >
                  {row.label}
                </td>

                {accessColumns.map((column) => (
                  <td key={column.key} className="px-6 py-8 text-center">
                    <div className="flex justify-center" onClick={() => readOnly && onReadOnlyClick?.()}>
                      {(!row.allowedActions || row.allowedActions.includes(column.key)) ? (
                        <Checkbox
                          checked={row.access[column.key]}
                          onCheckedChange={(value) =>
                            toggleAccess(row.id, column.key, value === true)
                          }
                          disabled={readOnly}
                          className={`h-6 w-6 rounded-md bg-transparent disabled:cursor-not-allowed ${
                            isDark
                              ? "border-white/10 data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                              : "border-[#D0D0D0] data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E] data-[state=checked]:text-white"
                          }`}
                        />
                      ) : (
                        <span className={isDark ? "text-white/10" : "text-[#32323240]"}>—</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
