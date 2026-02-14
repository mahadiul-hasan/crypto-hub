import type { Metadata } from "next";
import { Baloo_Da_2 } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

const balloDa2 = Baloo_Da_2({
  variable: "--font-baloo-da_2",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crypto Hub",
  description: "A crypto learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${balloDa2.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
