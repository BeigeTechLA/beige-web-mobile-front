"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface Props<T> {
  data: T[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  headers: string[]; // Added to keep the table structure intact
  renderRow: (item: T) => React.ReactNode;
  onPageChange: (page: number) => void;
}

export default function UsersTable<T>({
  data,
  loading,
  currentPage,
  totalPages,
  totalRecords,
  limit,
  headers,
  renderRow,
  onPageChange,
}: Props<T>) {
  return (
    <div className="space-y-6">
      <div className="w-full bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#101010] text-[#E8D1AB] text-sm">
                {headers.map((header, idx) => (

                //    <thead>
                // <tr className="bg-[#101010] text-[#E8D1AB] text-sm">
                //   <th className="py-5 px-6">Client Name</th>
                //   <th className="py-5 px-6">Email</th>
                //   <th className="py-5 px-6">Intent Type</th>
                //   <th className="py-5 px-6">Booking Status</th>
                //   <th className="py-5 px-6">Last Activity</th>
                //   <th className="py-5 px-6 text-right">Action</th>
                // </tr>
              // </thead>
                  <th 
                    key={header} 
                    className={`py-5 px-6 font-medium ${idx === headers.length - 1 ? 'text-right' : ''}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={headers.length} className="py-10 text-center text-[#888]">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-[#E8D1AB]" size={24} />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="py-10 text-center text-[#888]">
                    No users found.
                  </td>
                </tr>
              ) : (
                data.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Styling preserved from Code 1 */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center p-6 border border-[#333] rounded-2xl bg-[#171717]">
          <div className="text-sm text-[#666666]">
            Showing {(currentPage - 1) * limit + 1} to{" "}
            {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => onPageChange(i + 1)}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                    currentPage === i + 1 ? "bg-[#E5D5B8] text-black" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#111] text-white/60 border border-[#333] hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}