import { getCurrentUser } from "./auth";
import { UserRole } from "./generated/prisma/enums";

export type Permission =
  | "USER_MANAGE"
  | "USER_DELETE"
  | "BATCH_MANAGE"
  | "ENROLLMENT_APPROVE"
  | "PAYMENT_VERIFY"
  | "CLASS_MANAGE"
  | "NOTIFICATION_SEND"
  | "ADMIN_PANEL";

/* ===============================
   Role → Permission Map
================================ */

export const RolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "USER_MANAGE",
    "USER_DELETE",
    "BATCH_MANAGE",
    "ENROLLMENT_APPROVE",
    "PAYMENT_VERIFY",
    "CLASS_MANAGE",
    "NOTIFICATION_SEND",
    "ADMIN_PANEL",
  ],

  STUDENT: [],
};

export function hasPermission(userRole: UserRole, permission: Permission) {
  const permissions = RolePermissions[userRole] || [];

  return permissions.includes(permission);
}

export async function requireRole(roles: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
