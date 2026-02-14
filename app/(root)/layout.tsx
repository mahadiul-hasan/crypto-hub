import { Footer } from "@/components/common/app/footer";
import { Navbar } from "@/components/common/app/navbar";
import { UserProvider } from "@/context/UserContext";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <UserProvider user={user}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </UserProvider>
  );
}
