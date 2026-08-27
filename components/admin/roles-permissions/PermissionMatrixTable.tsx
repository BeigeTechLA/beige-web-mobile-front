"use client";

import { ChevronDown, Minus } from "lucide-react";
import { Fragment } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  type PermissionColumnKey,
  type PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";
import {
  ALL_PERMISSION_ACTIONS,
  computeParentCheckState,
} from "@/components/admin/roles-permissions/utils";

type PermissionMatrixTableProps = {
  rows: PermissionMatrixRow[];
  onChange?: React.Dispatch<React.SetStateAction<PermissionMatrixRow[]>>;
  showSelectionColumn?: boolean;
  className?: string;
  readOnly?: boolean;
  onReadOnlyClick?: () => void;
};

const accessColumns: { key: PermissionColumnKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
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

  const checkboxClass = `h-6 w-6 rounded-md border transition-all duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed ${
    isDark
      ? "border-white/20 bg-[#101010] hover:border-[#E5D5B8]/70 focus-visible:ring-[#E5D5B8]/35 data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
      : "border-[#D0D0D0] bg-white hover:border-[#C9A96E]/80 focus-visible:ring-[#C9A96E]/35 data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E] data-[state=checked]:text-white"
  }`;

  const renderCheckbox = ({
    checked,
    indeterminate = false,
    onCheckedChange,
    disabled = false,
    sizeClass = checkboxClass,
    ariaLabel,
  }: {
    checked: boolean;
    indeterminate?: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    sizeClass?: string;
    ariaLabel?: string;
  }) => (
    <span className="relative inline-flex">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={sizeClass}
      />
      {indeterminate ? (
        <Minus
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 m-auto h-4 w-4 ${
            isDark ? "text-[#E5D5B8]" : "text-[#8E6A2A]"
          }`}
        />
      ) : null}
    </span>
  );

  const getRowAccess = (row: PermissionMatrixRow) => {
    if (!row.children) return row.access;
    const checked = row.checkState === "checked";
    return ALL_PERMISSION_ACTIONS.reduce(
      (access, action) => {
        access[action] = Boolean(row.allowedActions?.includes(action)) && checked;
        return access;
      },
      { view: false, create: false, edit: false, delete: false },
    );
  };

  const updateGroupedRow = (
    row: PermissionMatrixRow,
    children: PermissionMatrixRow[],
    isExpanded = row.isExpanded,
  ): PermissionMatrixRow => {
    const checkState = computeParentCheckState(children);
    const mirroredAccess = ALL_PERMISSION_ACTIONS.reduce(
      (access, action) => {
        access[action] = row.allowedActions?.includes(action)
          ? checkState === "checked"
          : false;
        return access;
      },
      { view: false, create: false, edit: false, delete: false },
    );

    return {
      ...row,
      access: mirroredAccess,
      children,
      checkState,
      selected: checkState === "checked",
      isExpanded,
    };
  };

  const toggleSelection = (rowId: string, checked: boolean) => {
    if (readOnly) return;

    onChange?.(
      (currentRows) => currentRows.map((row) => {
        if (row.id === rowId && row.children) {
          const shouldCheck = row.checkState !== "checked";
          const children = row.children.map((child) => ({
            ...child,
            selected: shouldCheck,
            access: ALL_PERMISSION_ACTIONS.reduce(
              (access, action) => {
                access[action] = child.allowedActions?.includes(action)
                  ? shouldCheck
                  : false;
                return access;
              },
              { view: false, create: false, edit: false, delete: false },
            ),
          }));
          return updateGroupedRow(row, children, true);
        }

        if (row.children) {
          const child = row.children.find((candidate) => candidate.id === rowId);
          if (!child) return row;

          const children = row.children.map((candidate) => {
            if (candidate.id !== rowId) return candidate;
            const access = { ...candidate.access };
            (candidate.allowedActions || ALL_PERMISSION_ACTIONS).forEach((action) => {
              access[action] = checked;
            });
            return { ...candidate, selected: checked, access };
          });

          return updateGroupedRow(row, children);
        }

        if (row.id !== rowId) return row;
        const access = { ...row.access };
        const actionsToToggle = row.allowedActions || ALL_PERMISSION_ACTIONS;
        actionsToToggle.forEach((action) => {
          access[action] = checked;
        });
        return { ...row, selected: checked, access };
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
      (currentRows) => currentRows.map((row) => {
        if (row.id === rowId && row.children) return row;
        if (row.id !== rowId) return row;

        const updatedAccess = { ...row.access, [key]: checked };
        const actionsToCheck = row.allowedActions || ALL_PERMISSION_ACTIONS;
        if (checked && key !== "view") updatedAccess.view = true;
        if (key === "view") {
          actionsToCheck.forEach((action) => {
            updatedAccess[action] = checked;
          });
        }
        const allAllowedChecked = actionsToCheck.every(
          (action) => updatedAccess[action],
        );

        return {
          ...row,
          access: updatedAccess,
          selected: allAllowedChecked,
        };
      }),
    );
  };

  const toggleChildAccess = (
    parentId: string,
    childId: string,
    key: PermissionColumnKey,
    checked: boolean,
  ) => {
    if (readOnly) {
      onReadOnlyClick?.();
      return;
    }

    onChange?.(
      (currentRows) => currentRows.map((row) => {
        if (row.id !== parentId || !row.children) return row;

        const children = row.children.map((child) => {
          if (child.id !== childId) return child;
          const access = { ...child.access, [key]: checked };
          return {
            ...child,
            access,
            selected: (child.allowedActions || ALL_PERMISSION_ACTIONS).every(
              (action) => access[action],
            ),
          };
        });

        return updateGroupedRow(row, children);
      }),
    );
  };

  const toggleExpanded = (rowId: string) => {
    onChange?.(
      (currentRows) => currentRows.map((row) =>
        row.id === rowId && row.children
          ? { ...row, isExpanded: !row.isExpanded }
          : row,
      ),
    );
  };

  const allSelected = rows.length > 0 && rows.every((row) => {
    if (row.children) return row.checkState === "checked";
    return row.selected;
  });

  const toggleAllRows = (checked: boolean) => {
    if (readOnly) return;
    onChange?.(
      (currentRows) => currentRows.map((row) => {
        if (row.children) {
          const children = row.children.map((child) => ({
            ...child,
            selected: checked,
            access: ALL_PERMISSION_ACTIONS.reduce(
              (access, action) => {
                access[action] = child.allowedActions?.includes(action)
                  ? checked
                  : false;
                return access;
              },
              { view: false, create: false, edit: false, delete: false },
            ),
          }));
          return updateGroupedRow(row, children, checked ? true : row.isExpanded);
        }

        const access = { ...row.access };
        (row.allowedActions || ALL_PERMISSION_ACTIONS).forEach((action) => {
          access[action] = checked;
        });
        return { ...row, selected: checked, access };
      }),
    );
  };

  const getChildSummary = (row: PermissionMatrixRow) => {
    if (!row.children?.length) return null;

    const selectedChildren = row.children.filter(
      (child) =>
        child.selected ||
        (child.allowedActions || ALL_PERMISSION_ACTIONS).some(
          (action) => child.access[action],
        ),
    ).length;

    return `${selectedChildren}/${row.children.length}`;
  };

  const renderRow = (
    row: PermissionMatrixRow,
    parentId?: string,
    isChild = false,
  ) => {
    const isGroupedParent = Boolean(row.children);
    const rowAccess = getRowAccess(row);
    const checkState = isGroupedParent
      ? row.checkState || "unchecked"
      : row.selected
        ? "checked"
        : "unchecked";

    const childSummary = getChildSummary(row);

    return (
      <tr
        key={row.id}
        className={`group transition-colors ${
          isChild
            ? isDark
              ? "bg-[#202020] text-white hover:bg-[#242424]"
              : "bg-[#FFFDF8] text-[#101010] hover:bg-[#FFF8EA]"
            : isGroupedParent
              ? isDark
                ? "bg-[#181818] text-white hover:bg-[#1D1D1D]"
                : "bg-[#FBF6EB] text-[#101010] hover:bg-[#F7EEDC]"
              : isDark
                ? "bg-[#171717] text-white hover:bg-[#1D1D1D]"
                : "bg-white text-[#101010] hover:bg-[#FBFBFB]"
        }`}
      >
        {showSelectionColumn ? (
          <td className={`w-px whitespace-nowrap p-4 lg:p-5 ${isChild ? "pl-8 lg:pl-12" : ""}`}>
            {renderCheckbox({
              checked: checkState === "checked",
              indeterminate: checkState === "indeterminate",
              onCheckedChange: (checked) => toggleSelection(row.id, checked),
              disabled: readOnly,
              ariaLabel: `${row.label} permissions`,
              sizeClass: `h-5 w-5 rounded-md border transition-all duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed ${
                isDark
                  ? "border-white/25 bg-[#101010] hover:border-[#E5D5B8]/70 focus-visible:ring-[#E5D5B8]/35 data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                  : "border-[#CFC5B3] bg-white hover:border-[#C9A96E]/80 focus-visible:ring-[#C9A96E]/35 data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E] data-[state=checked]:text-white"
              }`,
            })}
          </td>
        ) : null}

        <td
        className={`min-w-[300px] whitespace-nowrap py-4 px-2 lg:p-5 text-sm lg:text-base font-medium transition-colors ${
            isDark
              ? "group-hover:text-[#E5D5B8]"
              : "group-hover:text-[#8E6A2A]"
          } ${
            isChild
              ? isDark
                ? "pl-8 text-sm font-normal text-white/65 lg:pl-12"
                : "pl-8 text-sm font-normal text-[#32323299] lg:pl-12"
              : "font-semibold"
          }`}
        >
          <div className="relative flex items-center gap-3">
            {isChild ? (
              <span
                aria-hidden="true"
                className={`absolute -left-4 top-1/2 h-px w-3 ${isDark ? "bg-[#E5D5B8]/40" : "bg-[#C9A96E]/50"}`}
              />
            ) : null}
            <span className={isChild ? "" : isDark ? "text-white" : "text-[#101010]"}>
              {row.label}
            </span>
            {childSummary ? (
              <span
                className={`ml-1 inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium ${
                  isDark
                    ? "border-[#E5D5B8]/20 bg-[#E5D5B8]/10 text-[#E5D5B8]"
                    : "border-[#C9A96E]/25 bg-white text-[#8E6A2A]"
                }`}
              >
                {childSummary}
              </span>
            ) : null}
            {isGroupedParent ? (
              <button
                type="button"
                aria-label={`${row.isExpanded ? "Collapse" : "Expand"} ${row.label}`}
                onClick={() => toggleExpanded(row.id)}
                className={`ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${
                  isDark
                    ? "border-white/10 bg-[#101010] text-[#E5D5B8] hover:border-[#E5D5B8]/40 hover:bg-[#242015]"
                    : "border-[#E8DCC6] bg-white text-[#8E6A2A] hover:border-[#C9A96E]/60 hover:bg-[#FFF8EA]"
                }`}
              >
                <ChevronDown
                  size={17}
                  className={`shrink-0 transition-transform ${row.isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}
          </div>
        </td>

        {accessColumns.map((column) => (
          <td key={column.key} className="w-[150px] whitespace-nowrap py-4 px-3 lg:p-5 text-center">
            <div
              className="flex justify-center"
              onClick={() => readOnly && onReadOnlyClick?.()}
            >
              {(!row.allowedActions || row.allowedActions.includes(column.key)) ? (
                renderCheckbox({
                  checked: Boolean(rowAccess[column.key]),
                  onCheckedChange: (checked) =>
                    isChild && parentId
                      ? toggleChildAccess(parentId, row.id, column.key, checked)
                      : toggleAccess(row.id, column.key, checked),
                  disabled: readOnly || isGroupedParent,
                  ariaLabel: `${row.label} ${column.label}`,
                })
              ) : (
                <span
                  className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full text-xs ${
                    isDark ? "bg-white/[0.03] text-white/15" : "bg-black/[0.03] text-[#32323240]"
                  }`}
                >
                  -
                </span>
              )}
            </div>
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl ${
        isDark
          ? "border border-[#3D3D3D] bg-[#171717]"
          : "border border-[#E3E3E3] bg-white shadow-[0_10px_24px_rgba(16,16,16,0.08)]"
      } ${className}`}
    >
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-20">
            <tr className={`text-left text-xs font-semibold uppercase ${isDark ? "bg-[#101010] text-[#E8D1AB]" : "bg-[#FFFCF6] text-[#8B744D]"}`}>
              {showSelectionColumn ? (
                <th className={`w-px whitespace-nowrap p-4 lg:p-5 rounded-l-2xl border-b ${isDark ? "border-[#3D3D3D]" : "border-[#E3E3E3]"}`}>
                  <div className="flex items-center gap-3">
                    {renderCheckbox({
                      checked: allSelected,
                      onCheckedChange: toggleAllRows,
                      disabled: readOnly,
                      sizeClass: `h-5 w-5 rounded-md border transition-all duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed ${
                        isDark
                          ? "border-white/25 bg-[#171717] hover:border-[#E5D5B8]/70 focus-visible:ring-[#E5D5B8]/35 data-[state=checked]:border-[#E5D5B8] data-[state=checked]:bg-[#E5D5B8] data-[state=checked]:text-black"
                          : "border-[#CFC5B3] bg-white hover:border-[#C9A96E]/80 focus-visible:ring-[#C9A96E]/35 data-[state=checked]:border-[#C9A96E] data-[state=checked]:bg-[#C9A96E] data-[state=checked]:text-white"
                      }`,
                    })}
                    <span>All</span>
                  </div>
                </th>
              ) : (
                <th className={`min-w-[300px] whitespace-nowrap py-4 px-2 lg:p-5 font-medium rounded-l-2xl border-b ${isDark ? "border-[#3D3D3D]" : "border-[#E3E3E3]"}`}>
                  Access To
                </th>
              )}
              {showSelectionColumn ? (
                <th className={`min-w-[300px] whitespace-nowrap py-4 px-2 lg:p-5 font-medium border-b ${isDark ? "border-[#3D3D3D]" : "border-[#E3E3E3]"}`}>
                  Access To
                </th>
              ) : null}
              {accessColumns.map((column) => (
                <th
                  key={column.key}
                  className={`w-[150px] whitespace-nowrap py-4 px-3 text-center font-medium last:rounded-r-2xl lg:p-5 border-b ${isDark ? "border-[#3D3D3D]" : "border-[#E3E3E3]"}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={`divide-y ${isDark ? "divide-[#333]" : "divide-[#E3E3E3]"}`}>
            {rows.map((row) => (
              <Fragment key={row.id}>
                {renderRow(row)}
                {row.children && row.isExpanded === true
                  ? row.children.map((child) => renderRow(child, row.id, true))
                  : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
