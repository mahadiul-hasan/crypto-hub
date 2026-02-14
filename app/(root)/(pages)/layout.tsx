export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
