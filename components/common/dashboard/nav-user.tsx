"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, User, Settings } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Spinner } from "../spinner";
import { LogoutButton } from "../app/logout-button";

interface NavUserProps {
  isCollapsed?: boolean;
}

export function NavUser({ isCollapsed = false }: NavUserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useUser();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center py-2">
        <Spinner size="sm" variant="secondary" />
      </div>
    );
  }

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex w-full items-center rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200
          ${isCollapsed ? "justify-center" : "justify-between"}
        `}
      >
        <div className={`flex items-center ${isCollapsed ? "" : "space-x-3"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-semibold shrink-0">
            {getUserInitials()}
          </div>
          {!isCollapsed && (
            <div className="flex flex-1 flex-col text-left">
              <span className="text-sm font-medium text-gray-900 truncate max-w-30">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 truncate max-w-30">
                {user.email}
              </span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronsUpDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
          absolute bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48
          ${isCollapsed ? "left-full ml-2 bottom-0" : "bottom-full left-0 mb-2 w-full"}
        `}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <p className="text-xs text-violet-600 mt-1 capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>

          <Link
            href={
              user.role === "ADMIN"
                ? "/dashboard/admin/profile"
                : "/dashboard/profile"
            }
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>

          <div className="border-t border-gray-100 my-1"></div>

          <div className="px-2">
            <LogoutButton variant="desktop" />
          </div>
        </div>
      )}
    </div>
  );
}
