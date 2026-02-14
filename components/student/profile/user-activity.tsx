import { Activity, Calendar } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { getUserDashboardStatsAction } from "@/actions/user.action";

export async function UserActivity() {
  const data = await getUserDashboardStatsAction();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100">
        {data.recentActivity.length > 0 ? (
          data.recentActivity.map((activity: any) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-violet-50 rounded-lg">
                  <Activity className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Enrolled in{" "}
                    <span className="font-medium">{activity.batchName}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : activity.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {activity.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No recent activity</p>
          </div>
        )}
      </div>

      {/* Next Class Preview */}
      {data.nextClass && (
        <div className="border-t border-gray-200 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-violet-600" />
            <p className="text-xs font-medium text-violet-700">Next Class</p>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {data.nextClass.title}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {data.nextClass.batchName} •{" "}
            {formatRelativeTime(data.nextClass.startsAt)}
          </p>
        </div>
      )}
    </div>
  );
}
