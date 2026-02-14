import Link from "next/link";

export default function BlockedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Account not activated</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your account is currently blocked or not activated. If you
          haven&apos;t verified your email yet, please check your inbox and
          verify your account.
        </p>

        <div className="mt-5 space-y-3">
          <Link
            href="/auth/login"
            className="block w-full rounded-xl bg-black px-4 py-2 text-center text-sm font-medium text-white"
          >
            Go to Login
          </Link>

          <Link
            href="/auth/forgot-password"
            className="block w-full rounded-xl border px-4 py-2 text-center text-sm font-medium"
          >
            Forgot password?
          </Link>

          <p className="pt-2 text-xs text-gray-500">
            If you believe this is a mistake, please contact the admin/support.
          </p>
        </div>
      </div>
    </div>
  );
}
