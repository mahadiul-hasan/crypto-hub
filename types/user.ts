import { UserRole } from "@/lib/generated/prisma/enums";

export type User = {
  name: string;
  email: string;
  id: string;
  role: UserRole;
  createdAt: Date;
  isActive: boolean;
  isVerified: boolean;
} | null;
