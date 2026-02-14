import { ReactNode } from "react";
import { UserProvider } from "@/context/UserContext";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/common/dashboard/sidebar";
import Header from "@/components/common/dashboard/header";
import { SidebarTrigger } from "@/components/common/dashboard/sidebar-trigger";
import { SidebarProvider } from "@/context/SidebarContext";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <UserProvider user={user}>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
              <SidebarTrigger />
              <div className="h-6 w-px bg-gray-200" />
              <Header />
            </header>
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
