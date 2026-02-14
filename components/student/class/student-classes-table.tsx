"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Copy,
  Link2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatTime } from "@/lib/utils";
import { DataTable } from "@/components/common/data-table/index";
import { StatusBadge } from "@/components/common/data-table/status-badge";

type ClassSession = {
  id: string;
  title: string;
  meetingUrl: string;
  startsAt: string;
  endsAt: string;
  status: "ACTIVE" | "EXPIRED";
  batch: {
    name: string;
  };
};

interface StudentClassesTableProps {
  initialClasses: ClassSession[];
}

function getClassStatus(startsAt: string, endsAt: string) {
  const now = new Date();
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "ended";
}

function getStatusText(startsAt: string, endsAt: string, dbStatus: string) {
  if (dbStatus === "EXPIRED") return "Expired";

  const status = getClassStatus(startsAt, endsAt);
  if (status === "live") return "Live Now";
  if (status === "upcoming") return "Upcoming";
  return "Ended";
}

function getStatusVariant(
  startsAt: string,
  endsAt: string,
  dbStatus: string,
): "success" | "info" | "warning" | "default" {
  if (dbStatus === "EXPIRED") return "default";

  const status = getClassStatus(startsAt, endsAt);
  if (status === "live") return "success";
  if (status === "upcoming") return "info";
  return "warning";
}

export function StudentClassesTable({
  initialClasses,
}: StudentClassesTableProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const handleCopyLink = (url: string, title: string) => {
    navigator.clipboard.writeText(url);
    showToast(`Meeting link for "${title}" copied to clipboard`, "success");
  };

  const handleAddToCalendar = (cls: ClassSession) => {
    const start = new Date(cls.startsAt);
    const end = new Date(cls.endsAt);

    // Format dates for Google Calendar
    const startFormatted = start
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const endFormatted = end
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cls.title)}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent("Class: " + cls.title + "\nBatch: " + cls.batch.name + "\n\nMeeting Link: " + cls.meetingUrl)}&location=${encodeURIComponent(cls.meetingUrl)}`;

    window.open(googleCalendarUrl, "_blank");
    showToast(`Adding "${cls.title}" to your calendar...`, "info");
  };

  const handleViewMeetingLink = (url: string) => {
    window.open(url, "_blank");
  };

  const columns = [
    {
      key: "title",
      header: "Class",
      sortable: true,
      cell: (cls: ClassSession) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{cls.title}</p>
          <p className="text-xs text-gray-500">{cls.batch.name}</p>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      cell: (cls: ClassSession) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span>{formatDate(cls.startsAt)}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span>
              {formatTime(cls.startsAt)} - {formatTime(cls.endsAt)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (cls: ClassSession) => {
        const status = getClassStatus(cls.startsAt, cls.endsAt);
        const isLive = status === "live";
        const isUpcoming = status === "upcoming";

        return (
          <div className="space-y-1">
            <StatusBadge
              status={getStatusText(cls.startsAt, cls.endsAt, cls.status)}
              variant={getStatusVariant(cls.startsAt, cls.endsAt, cls.status)}
            />
            {isLive && (
              <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Ready to join
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "meeting",
      header: "Meeting Link",
      cell: (cls: ClassSession) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Link2 className="h-3 w-3" />
              <span className="truncate max-w-37.5">{cls.meetingUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(cls.meetingUrl, cls.title)}
                className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-violet-600 transition-colors group cursor-pointer"
                title="Copy meeting link"
              >
                <Copy className="h-3 w-3 group-hover:scale-110 transition-transform" />
                <span>Copy link</span>
              </button>

              <button
                onClick={() => handleViewMeetingLink(cls.meetingUrl)}
                className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors group cursor-pointer"
                title="Open meeting link"
              >
                <ExternalLink className="h-3 w-3 group-hover:scale-110 transition-transform" />
                <span>Open</span>
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Quick Actions",
      cell: (cls: ClassSession) => {
        const isLive = getClassStatus(cls.startsAt, cls.endsAt) === "live";
        const isUpcoming =
          getClassStatus(cls.startsAt, cls.endsAt) === "upcoming";

        return (
          <div className="flex items-center gap-2">
            {isLive && (
              <Link
                href={cls.meetingUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-md hover:scale-105"
              >
                <Video className="h-4 w-4" />
                Join Class Now
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}

            {isUpcoming && (
              <button
                onClick={() => handleAddToCalendar(cls)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-md hover:scale-105 cursor-pointer"
                title="Add to Google Calendar"
              >
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </button>
            )}

            {!isLive && !isUpcoming && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(cls.meetingUrl, cls.title)}
                  className="p-2 border border-gray-200 hover:border-violet-300 rounded-lg text-gray-600 hover:text-violet-600 transition-all hover:shadow-sm group cursor-pointer"
                  title="Copy meeting link"
                >
                  <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => handleViewMeetingLink(cls.meetingUrl)}
                  className="p-2 border border-gray-200 hover:border-blue-300 rounded-lg text-gray-600 hover:text-blue-600 transition-all hover:shadow-sm group cursor-pointer"
                  title="Open meeting link"
                >
                  <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // Simple filters for students
  const filters = [
    {
      key: "search",
      label: "Search",
      type: "search" as const,
      placeholder: "Search by class title or batch...",
      value: "",
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "all", label: "All Classes" },
        { value: "live", label: "Live Now" },
        { value: "upcoming", label: "Upcoming" },
        { value: "ended", label: "Ended" },
      ],
      value: "all",
    },
  ];

  // Simple pagination for students (no page size change)
  const pagination = {
    page: 1,
    pageSize: 10,
    totalCount: initialClasses.length,
    totalPages: Math.ceil(initialClasses.length / 10),
  };

  const handleFilterChange = () => {};
  const handleApplyFilters = () => {};
  const handleResetFilters = () => {};
  const handlePageChange = () => {};
  const handlePageSizeChange = () => {};

  return (
    <div className="space-y-4">
      <DataTable
        data={initialClasses}
        columns={columns}
        filters={filters}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        selectable={false}
      />
    </div>
  );
}
