import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

//Import the provider
import AuthSessionProvider from "./api/providers/AuthSessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prescription App",
  description: "Prescription App for managing medical prescriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
      >
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
