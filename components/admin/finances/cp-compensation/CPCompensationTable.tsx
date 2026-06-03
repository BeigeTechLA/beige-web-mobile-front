"use client";

import React from "react";
import ShootsCompensationTable from "./ShootsCompensationTable";
import CreatorsCompensationTable from "./CreatorsCompensationTable";

interface CPCompensationTableProps {
  type: "shoots" | "creators";
}

export default function CPCompensationTable({ type }: CPCompensationTableProps) {
  if (type === "shoots") {
    return <ShootsCompensationTable />;
  }

  return <CreatorsCompensationTable />;
}


