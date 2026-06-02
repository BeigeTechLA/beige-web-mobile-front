"use client";

import { Checkbox } from "@/components/ui/checkbox";
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
  onInvalidAccessAttempt?: (row: PermissionMatrixRow, key: PermissionColumnKey) => void;
};

const accessColumns: { key: PermissionColumnKey; label: string }[] = [
  { key: "view", label: "View Access" },
  { key: "create", label: "Create Access" },
  { key: "edit", label: "Edit Access" },
  { key: "delete", label: "Delete Access" },
];

const getActionsToToggle = (row: PermissionMatrixRow) =>
  row.allowedActions?.length ? row.allowedActions : accessColumns.map((column) => column.key);

export function PermissionMatrixTable({
  rows,
  onChange,
  showSelectionColumn = false,
  className = "",
  readOnly = false,
  onReadOnlyClick,
  onInvalidAccessAttempt,
}: PermissionMatrixTableProps) {
  const toggleSelection = (rowId: string, checked: boolean) => {
    if (readOnly) return;
    onChange?.(
      rows.map((row) => {
        if (row.id === rowId) {
          const newAccess = { ...row.access };
          const actionsToToggle = getActionsToToggle(row);

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

    const targetRow = rows.find((row) => row.id === rowId);
    if (!targetRow) return;

    if (checked && key !== "view" && !targetRow.access.view) {
      onInvalidAccessAttempt?.(targetRow, key);
      return;
    }

    onChange?.(
      rows.map((row) => {
        if (row.id === rowId) {
          const updatedAccess = { ...row.access, [key]: checked };
          const actionsToCheck = getActionsToToggle(row);
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
        const actionsToToggle = getActionsToToggle(row);

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
      className={`overflow-hidden rounded-[32px] ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">
          <thead>
            <tr className="text-left text-[14px] font-semibold text-[#D9C8A3]/60 uppercase tracking-wider">
              {showSelectionColumn ? (
                <th className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(value) => toggleAllRows(value === true)}
                      disabled={readOnly}
                      className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black disabled:cursor-not-allowed"
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
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="group text-white transition-colors hover:bg-white/[0.02]"
              >
                {showSelectionColumn ? (
                  <td className="px-6 py-6">
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={(value) =>
                        toggleSelection(row.id, value === true)
                      }
                      disabled={readOnly}
                      className="h-5 w-5 rounded-md border-white/20 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black disabled:cursor-not-allowed"
                    />
                  </td>
                ) : null}

                <td className="px-6 py-8 text-[16px] font-medium transition-colors group-hover:text-[#E5D5B8]">{row.label}</td>

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
                          className="h-6 w-6 rounded-md border-white/10 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black disabled:cursor-not-allowed"
                        />
                      ) : (
                        <span className="text-white/10">—</span>
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
