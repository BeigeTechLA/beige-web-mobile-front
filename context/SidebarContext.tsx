"use client";
import React, { createContext, useContext, useState } from 'react';

// 1. Define the interface so TypeScript knows these exist
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// 2. Initialize with default values
const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);