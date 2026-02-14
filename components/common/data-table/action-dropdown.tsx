"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { Action } from "./types";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface ActionDropdownProps<T> {
  item: T;
  actions: Action<T>[];
  isDisabled?: boolean;
  onDeleteClick: () => void;
}

export function ActionDropdown<T>({
  item,
  actions,
  isDisabled,
  onDeleteClick,
}: ActionDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [openAbove, setOpenAbove] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll to close dropdown
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  // Handle resize to reposition
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // Approximate height

      const spaceBelow = viewportHeight - rect.bottom;
      const shouldOpenAbove =
        spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setOpenAbove(shouldOpenAbove);

      if (shouldOpenAbove) {
        setPosition({
          top: rect.top + window.scrollY - dropdownHeight + 10,
          left: rect.left + window.scrollX - 160,
        });
      } else {
        setPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX - 160,
        });
      }
    }
  };

  const toggleDropdown = () => {
    if (isDisabled) return;

    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Resolve label (could be string or function)
  const getLabel = (action: Action<T>) => {
    if (typeof action.label === "function") {
      return action.label(item);
    }
    return action.label;
  };

  // Resolve icon (could be ReactNode or function)
  const getIcon = (action: Action<T>) => {
    if (typeof action.icon === "function") {
      return action.icon(item);
    }
    return action.icon;
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-99999 min-w-45",
        openAbove ? "origin-bottom" : "origin-top",
        "animate-in fade-in zoom-in-95 duration-100",
      )}
      style={{ top: position.top, left: position.left }}
    >
      {actions.map((action, index) => {
        const disabled = action.disabled?.(item);
        const label = getLabel(action);
        const icon = getIcon(action);

        if (label === "Delete" || label === "delete") {
          return (
            <button
              key={index}
              onClick={() => {
                onDeleteClick();
                setIsOpen(false);
              }}
              disabled={disabled}
              className={cn(
                "w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors cursor-pointer disabled:cursor-not-allowed",
                "text-red-600 hover:bg-red-50",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          );
        }

        return (
          <button
            key={index}
            onClick={() => {
              action.onClick(item);
              setIsOpen(false);
            }}
            disabled={disabled}
            className={cn(
              "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={isDisabled}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && mounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}
