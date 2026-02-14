import { getMyProfileAction } from "@/actions/user.action";
import { AdminProfile } from "@/components/admin/profile/admin-profile";
import { Shield } from "lucide-react";

export default async function AdminProfilePage() {
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
            <Shield className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your administrator account settings
            </p>
          </div>
        </div>
      </div>

      {/* Admin Profile Content */}
      <AdminProfile initialData={profile} />
    </div>
  );
}
