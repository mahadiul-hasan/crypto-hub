// lib/navigation.ts
export const routeTitles: Record<string, string> = {
  // Admin routes
  "/dashboard/admin": "Admin Dashboard",
  "/dashboard/admin/profile": "Profile Settings",
  "/dashboard/admin/users": "User Management",
  "/dashboard/admin/batches": "Batch Management",
  "/dashboard/admin/enrollments": "Enrollment Management",
  "/dashboard/admin/classes": "Class Management",
  "/dashboard/admin/payments": "Payment Management",
  "/dashboard/admin/notifications": "Notification Center",
  "/dashboard/admin/email-logs": "Email Logs",
  "/dashboard/admin/sessions": "User Sessions",
  "/dashboard/admin/tokens/verification": "Verification Tokens",
  "/dashboard/admin/tokens/password-reset": "Password Reset Tokens",
};

// Helper function to get title from path
export function getPageTitle(pathname: string): string {
  // Try exact match first
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  // Try to match with dynamic segments (like /dashboard/admin/users/[id])
  for (const [route, title] of Object.entries(routeTitles)) {
    // Remove query params for matching
    const cleanPath = pathname.split("?")[0];

    // Check if route matches (for dynamic routes)
    if (route.includes("[") && route.includes("]")) {
      // Convert dynamic route pattern to regex
      const pattern = route.replace(/\[.*?\]/g, "[^/]+").replace(/\//g, "\\/");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(cleanPath)) {
        return title;
      }
    }
  }

  // Fallback to the last segment of the path
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }

  return "Documents"; // Default fallback
}
