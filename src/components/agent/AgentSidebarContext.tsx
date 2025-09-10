// SidebarContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextProps {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const AgentSidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const AgentSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <AgentSidebarContext.Provider
      value={{ isOpen, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </AgentSidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(AgentSidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used inside SidebarProvider");
  }
  return context;
};
