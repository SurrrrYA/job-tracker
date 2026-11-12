import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth";
import { logout } from "./auth-actions";

export const metadata: Metadata = {
  title: "Pelacak lamaran kerja",
  description: "Catatan pribadi lamaran kerja",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  return (
    <html lang="id">
      <body>
        {authenticated && (
          <nav aria-label="Navigasi utama" className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-4xl items-center gap-5 px-4 py-3 text-sm">
              <Link href="/" className="font-medium hover:underline">
                Daftar lamaran
              </Link>
              <Link href="/statistik" className="font-medium hover:underline">
                Statistik
              </Link>
              <form action={logout} className="ml-auto">
                <button type="submit" className="text-slate-600 hover:underline">
                  Keluar
                </button>
              </form>
            </div>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}