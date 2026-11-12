import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth";
import { logout } from "./auth-actions";
import NavLink from "./nav-link";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

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
      <body className={font.className}>
        {authenticated ? (
          <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr]">
            <aside className="bg-teal-950 text-teal-50">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:gap-0 md:py-6">
                <Link href="/" className="flex items-center gap-2 md:mb-8 md:px-1">
                  <span
                    aria-hidden
                    className="grid size-8 place-items-center rounded-lg bg-teal-400 text-sm font-bold text-teal-950"
                  >
                    L
                  </span>
                  <span className="text-sm font-semibold leading-tight">
                    Pelacak
                    <br className="hidden md:block" /> lamaran
                  </span>
                </Link>

                <nav aria-label="Navigasi utama" className="flex gap-1 md:flex-col">
                  <NavLink href="/">Daftar lamaran</NavLink>
                  <NavLink href="/statistik">Statistik</NavLink>
                </nav>

                <form action={logout} className="ml-auto md:ml-0 md:mt-auto">
                  <button
                    type="submit"
                    className="rounded-md px-3 py-2 text-sm text-teal-100/80 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Keluar
                  </button>
                </form>
              </div>
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}