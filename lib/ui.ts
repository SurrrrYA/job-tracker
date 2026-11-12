import { Status } from "@prisma/client";

export const STATUS_ORDER: Status[] = [
  Status.SAVED,
  Status.APPLIED,
  Status.TEST,
  Status.INTERVIEW,
  Status.OFFER,
  Status.REJECTED,
];

export const STATUS_LABEL: Record<Status, string> = {
  SAVED: "Tersimpan",
  APPLIED: "Terkirim",
  TEST: "Tes",
  INTERVIEW: "Interview",
  OFFER: "Penawaran",
  REJECTED: "Ditolak",
};

export const STATUS_BADGE: Record<Status, string> = {
  SAVED: "bg-slate-100 text-slate-700",
  APPLIED: "bg-sky-100 text-sky-800",
  TEST: "bg-amber-100 text-amber-900",
  INTERVIEW: "bg-violet-100 text-violet-800",
  OFFER: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

export const STATUS_DOT: Record<Status, string> = {
  SAVED: "bg-slate-400",
  APPLIED: "bg-sky-500",
  TEST: "bg-amber-500",
  INTERVIEW: "bg-violet-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-rose-500",
};

export const INPUT_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20";

// Tanggal hari ini (YYYY-MM-DD) menurut zona waktu WIB
export function todayJakarta(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
}

// Nilai untuk <input type="date">
export function toDateInput(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function formatDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}