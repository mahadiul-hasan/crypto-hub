import { requireUser } from "@/lib/auth";
import { hasPermission, Permission } from "@/lib/rbac";

/* ===============================
   Context
================================ */

export type ActionContext = {
  user: {
    id: string;
    role: string;
    email: string;
  };
};

/* ===============================
   Guards
================================ */

export function withAuth<T>(handler: (ctx: ActionContext) => Promise<T>) {
  return async () => {
    const user = await requireUser();

    return handler({
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
      },
    });
  };
}

export function withPermission<T>(
  permission: Permission,
  handler: (ctx: ActionContext) => Promise<T>,
) {
  return withAuth(async (ctx) => {
    const allowed = hasPermission(ctx.user.role as any, permission);

    if (!allowed) {
      throw new Error("Access denied");
    }

    return handler(ctx);
  });
}
