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
}: PermissionMatrixTableProps) {
  const toggleSelection = (rowId: string, checked: boolean) => {
    onChange?.(
      rows.map((row) =>
        row.id === rowId ? { ...row, selected: checked } : row,
      ),
    );
  };

  const toggleAccess = (
    rowId: string,
    key: PermissionColumnKey,
    checked: boolean,
  ) => {
    onChange?.(
      rows.map((row) =>
        row.id === rowId
          ? { ...row, access: { ...row.access, [key]: checked } }
          : row,
      ),
    );
  };

  const allSelected = rows.length > 0 && rows.every((row) => row.selected);

  const toggleAllRows = (checked: boolean) => {
    onChange?.(rows.map((row) => ({ ...row, selected: checked })));
  };

  return (
    <div
      className={`overflow-hidden rounded-[26px] border border-white/10 bg-[#141414] ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-[15px] text-[#D9C8A3]">
              {showSelectionColumn ? (
                <th className="px-5 py-5 font-medium lg:px-6">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(value) => toggleAllRows(value === true)}
                      className="h-6 w-6 rounded-md border-white/30 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                    />
                    <span>Select All</span>
                  </div>
                </th>
              ) : (
                <th className="px-5 py-5 font-medium lg:px-6">Access To</th>
              )}
              {showSelectionColumn ? (
                <th className="px-5 py-5 font-medium lg:px-6">Access To</th>
              ) : null}
              {accessColumns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-5 font-medium text-center lg:px-6"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/6 text-white last:border-b-0"
              >
                {showSelectionColumn ? (
                  <td className="px-5 py-6 lg:px-6">
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={(value) =>
                        toggleSelection(row.id, value === true)
                      }
                      className="h-6 w-6 rounded-md border-white/30 bg-transparent data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                    />
                  </td>
                ) : null}

                <td className="px-5 py-6 text-[18px] lg:px-6">{row.label}</td>

                {accessColumns.map((column) => (
                  <td key={column.key} className="px-5 py-6 text-center lg:px-6">
                    <Checkbox
                      checked={row.access[column.key]}
                      onCheckedChange={(value) =>
                        toggleAccess(row.id, column.key, value === true)
                      }
                      className="h-7 w-7 rounded-md border-[#737373] bg-transparent data-[state=checked]:border-[#F3E1BC] data-[state=checked]:bg-[#F3E1BC] data-[state=checked]:text-black"
                    />
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
