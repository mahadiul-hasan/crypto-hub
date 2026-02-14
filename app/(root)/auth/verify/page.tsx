import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { verifyEmailAction } from "@/actions/auth.actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-8 text-center border-b border-gray-100">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Invalid Link
            </h2>
            <p className="text-sm text-gray-500">
              No verification token provided
            </p>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-center text-gray-600">
              The verification link appears to be invalid. Please request a new
              verification email.
            </p>

            <div className="space-y-3">
              <Link
                href="/auth/resend-verification"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-violet-600 text-white hover:bg-violet-700 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Request New Verification Email
              </Link>
              <Link
                href="/auth/login"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-white text-violet-600 border border-violet-600 hover:bg-violet-50 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    await verifyEmailAction(token);

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-8 text-center border-b border-gray-100">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-sm text-gray-500">Your account is now active</p>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-center text-gray-600">
              Your email has been verified successfully. You can now log in to
              your account and access all features.
            </p>

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-violet-600 text-white hover:bg-violet-700 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Go to Login
              </Link>
              <Link
                href="/"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-white text-violet-600 border border-violet-600 hover:bg-violet-50 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Verification failed";
    const isExpired = errorMessage.toLowerCase().includes("expired");

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-8 text-center border-b border-gray-100">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {isExpired ? "Link Expired" : "Verification Failed"}
            </h2>
            <p className="text-sm text-gray-500">{errorMessage}</p>
          </div>

          <div className="p-6 space-y-6">
            {isExpired && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700 text-sm text-center">
                  This verification link has expired. Please request a new one.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href="/auth/resend-verification"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-violet-600 text-white hover:bg-violet-700 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Request New Verification Email
              </Link>
              <Link
                href="/auth/login"
                className="block w-full py-2.5 px-4 rounded-lg text-center font-medium
                  bg-white text-violet-600 border border-violet-600 hover:bg-violet-50 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
