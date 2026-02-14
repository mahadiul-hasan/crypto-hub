import { Calendar, Shield, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserStatsProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    isVerified: boolean;
    createdAt: string;
  };
}

export function UserStats({ user }: UserStatsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Account Info</h2>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-4">
        {/* Member Since */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-50 rounded-lg">
            <Calendar className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Account Type</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              user.isVerified ? "bg-green-50" : "bg-yellow-50"
            }`}
          >
            {user.isVerified ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Verification Status</p>
            <p
              className={`text-sm font-medium ${
                user.isVerified ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {user.isVerified ? "Verified" : "Not Verified"}
            </p>
            {!user.isVerified && (
              <p className="text-xs text-gray-500 mt-1">
                Check your email for verification link
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
