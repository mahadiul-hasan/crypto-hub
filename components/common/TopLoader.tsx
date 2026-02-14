"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500); // small fake delay so it’s visible
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return (
    <div
      className={`fixed left-0 top-0 z-9999 h-0.75 w-full transition-opacity ${
        loading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full w-full animate-pulse bg-violet-600" />
    </div>
  );
}
