"use client";

import { User } from "@/types/user";
import { createContext, ReactNode, useContext } from "react";

// Create context for user
const UserContext = createContext<User | null>(null);

// Custom hook to use user data
export function useUser() {
  const user = useContext(UserContext);
  return user;
}

export function UserProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: User;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
