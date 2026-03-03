"use client";

import React from "react";

interface TableData {
  [key: string]: string | React.ReactNode;
}

interface ReusableTableProps {
  titleColumns: [string, string];
  data: TableData[];
}

const ReusableTable = ({ titleColumns, data }: ReusableTableProps) => { 
  const columnKeys = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-[#3D3D3D] bg-[#202020] shadow-2xl">
      <table
        width="100%"
        border={0}
        cellSpacing={0}
        cellPadding={0}
      >
        <thead>
          <tr className="border-b border-[#3D3D3D]">
            {titleColumns.map((title, idx) => (
              <th
                key={idx}
                className={`p-6 text-left lg:text-lg font-medium tracking-wide text-[#E8D1AB] md:text-base ${idx === 0 ? "w-1/3 border-r border-[#3D3D3D]" : ""
                  }`}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[#171717]">
          {data.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              <tr>
                {columnKeys.map((key, colIdx) => (
                  <td
                    key={colIdx}
                    className={`${rowIndex === 0 ? "p-6":"pt-0 px-6 pb-6"} text-sm md:text-base align-top ${colIdx === 0
                      ? "font-medium text-white border-r border-[#3D3D3D]"
                      : "text-white/70 leading-relaxed font-light"
                      }`}
                  >
                    {row[key]}
                    {}
                  </td>
                ))}
              </tr>
            </React.Fragment>
          ))}
          
        </tbody>
      </table>
    </div>
  );
};


export default ReusableTable;