import { getMyProfileAction } from "@/actions/user.action";
import { UserActivity } from "@/components/student/profile/user-activity";
import { UserProfile } from "@/components/student/profile/user-profile";
import { UserStats } from "@/components/student/profile/user-stats";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const profile = await getMyProfileAction();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <User className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your personal information and account settings
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <UserProfile initialData={profile} />
        </div>

        {/* Stats Card - Takes 1 column */}
        <div className="lg:col-span-1">
          <UserStats user={profile} />
        </div>
      </div>

      {/* Recent Activity */}
      <UserActivity />
    </div>
  );
}
