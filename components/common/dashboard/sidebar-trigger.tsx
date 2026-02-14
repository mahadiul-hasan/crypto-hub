"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5 text-gray-600" />
    </button>
  );
}
