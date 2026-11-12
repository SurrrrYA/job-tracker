import Link from "next/link";
import { Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  INPUT_CLASS,
  STATUS_BADGE,
  STATUS_LABEL,
  STATUS_ORDER,
  formatDate,
  todayJakarta,
} from "@/lib/ui";
import { createApplication, deleteApplication, updateStatus } from "./actions";
import DeleteButton from "./delete-button";

export const dynamic = "force-dynamic";

type Sort = "updated" | "applied" | "company" | "next";

const SORT_ORDER: Sort[] = ["updated", "applied", "company", "next"];

const SORT_LABEL: Record<Sort, string> = {
  updated: "Terakhir diubah",
  applied: "Tanggal melamar",
  company: "Perusahaan A–Z",
  next: "Jadwal terdekat",
};

const STALE_DAYS = 14;

function buildHref(status: Status | null, q: string, sort: Sort) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (sort !== "updated") params.set("sort", sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function dueLabel(date: Date, todayStart: Date) {
  const diff = Math.round((date.getTime() - todayStart.getTime()) / 86400000);
  if (diff < 0) return { text: `Terlewat ${-diff} hari`, tone: "text-rose-700" };
  if (diff === 0) return { text: "Hari ini", tone: "text-teal-700" };
  if (diff === 1) return { text: "Besok", tone: "text-teal-700" };
  return { text: `${diff} hari lagi`, tone: "text-slate-600" };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}) {
  const { status: statusParam, q: qParam, sort: sortParam } = await searchParams;
  const activeStatus = STATUS_ORDER.find((s) => s === statusParam) ?? null;
  const sort = SORT_ORDER.find((s) => s === sortParam) ?? "updated";
  const q = (qParam ?? "").trim();

  const all = await prisma.application.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const needle = q.toLowerCase();
  const matched = needle
    ? all.filter((a) =>
        [a.company, a.position, a.source, a.notes]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(needle))
      )
    : all;

  const counts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: matched.filter((a) => a.status === s).length }),
    {} as Record<Status, number>
  );

  const filtered = activeStatus
    ? matched.filter((a) => a.status === activeStatus)
    : matched;

  const items = [...filtered].sort((a, b) => {
    switch (sort) {
      case "applied":
        return b.appliedAt.getTime() - a.appliedAt.getTime();
      case "company":
        return a.company.localeCompare(b.company, "id");
      case "next": {
        if (!a.nextDate && !b.nextDate) return 0;
        if (!a.nextDate) return 1;
        if (!b.nextDate) return -1;
        return a.nextDate.getTime() - b.nextDate.getTime();
      }
      default:
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  const today = todayJakarta();
  const todayStart = new Date(today);
  const nowMs = new Date().getTime();

  const upcoming = all
    .filter((a) => a.nextDate && a.status !== Status.REJECTED)
    .sort((a, b) => a.nextDate!.getTime() - b.nextDate!.getTime())
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lamaran kerja</h1>
          <p className="mt-1 text-sm text-slate-600">
            {all.length} lamaran tercatat. Ubah status setiap kali ada kabar baru.
          </p>
        </div>
        <a
          href="/export"
          download
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Ekspor CSV
        </a>
      </header>

      {upcoming.length > 0 && (
        <section
          aria-label="Jadwal terdekat"
          className="mb-8 rounded-lg border border-slate-200 bg-white p-4"
        >
          <h2 className="text-sm font-medium">Jadwal terdekat</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {upcoming.map((a) => {
              const due = dueLabel(a.nextDate!, todayStart);
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <Link href={`/edit/${a.id}`} className="font-medium hover:underline">
                      {a.company}
                    </Link>
                    <span className="text-slate-600">
                      {a.nextStep ? `: ${a.nextStep}` : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${due.tone}`}>{due.text}</span>
                    <span className="ml-2 text-slate-500">{formatDate(a.nextDate)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <form action="/" method="get" role="search" className="mb-4 flex flex-wrap items-center gap-2">
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        {sort !== "updated" && <input type="hidden" name="sort" value={sort} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Cari lamaran"
          placeholder="Cari perusahaan, posisi, sumber, atau catatan"
          className={`${INPUT_CLASS} flex-1`}
        />
        <button
          type="submit"
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Cari
        </button>
        {q && (
          <Link href={buildHref(activeStatus, "", sort)} className="text-sm text-slate-600 hover:underline">
            Hapus pencarian
          </Link>
        )}
      </form>

      <nav aria-label="Filter status" className="mb-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STATUS_ORDER.map((s) => {
          const isActive = activeStatus === s;
          return (
            <Link
              key={s}
              href={buildHref(isActive ? null : s, q, sort)}
              className={`rounded-md border px-3 py-2 text-left transition-colors ${
                isActive
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <span className="block text-xl font-semibold">{counts[s]}</span>
              <span className={`text-xs ${isActive ? "text-teal-50" : "text-slate-600"}`}>
                {STATUS_LABEL[s]}
              </span>
            </Link>
          );
        })}
      </nav>

      <details className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium">Tambah lamaran</summary>
        <form action={createApplication} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Perusahaan</span>
            <input name="company" required className={INPUT_CLASS} placeholder="PT Contoh Maju" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Posisi</span>
            <input name="position" required className={INPUT_CLASS} placeholder="Web Developer" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Status</span>
            <select name="status" defaultValue="APPLIED" className={INPUT_CLASS}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Sumber lowongan</span>
            <input name="source" className={INPUT_CLASS} placeholder="LinkedIn, Glints, situs perusahaan" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Tanggal melamar</span>
            <input type="date" name="appliedAt" defaultValue={today} className={INPUT_CLASS} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Tanggal langkah berikutnya</span>
            <input type="date" name="nextDate" className={INPUT_CLASS} />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-700">Langkah berikutnya</span>
            <input name="nextStep" className={INPUT_CLASS} placeholder="Psikotes online, interview HR, kirim portofolio" />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-700">Catatan</span>
            <textarea name="notes" rows={3} className={INPUT_CLASS} placeholder="Kontak HR, gaji yang ditawarkan, hal yang perlu dipelajari" />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Simpan lamaran
            </button>
          </div>
        </form>
      </details>

      {all.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-slate-500">Urutkan:</span>
          {SORT_ORDER.map((s) => (
            <Link
              key={s}
              href={buildHref(activeStatus, q, s)}
              aria-current={sort === s ? "true" : undefined}
              className={
                sort === s
                  ? "font-medium text-teal-700 underline underline-offset-4"
                  : "text-slate-600 hover:underline"
              }
            >
              {SORT_LABEL[s]}
            </Link>
          ))}
          <span className="ml-auto text-slate-500">{items.length} ditampilkan</span>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-600">
          {q
            ? `Tidak ada lamaran yang cocok dengan "${q}"${
                activeStatus ? ` berstatus ${STATUS_LABEL[activeStatus]}` : ""
              }.`
            : activeStatus
              ? `Belum ada lamaran dengan status ${STATUS_LABEL[activeStatus]}.`
              : "Belum ada lamaran. Buka \"Tambah lamaran\" untuk mencatat yang pertama."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const staleDays =
              a.status === Status.APPLIED
                ? Math.floor((nowMs - a.updatedAt.getTime()) / 86400000)
                : 0;

            return (
              <li key={a.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{a.company}</h2>
                    <p className="text-sm text-slate-600">{a.position}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>

                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="inline text-slate-500">Melamar: </dt>
                    <dd className="inline">{formatDate(a.appliedAt)}</dd>
                  </div>
                  {a.source && (
                    <div>
                      <dt className="inline text-slate-500">Sumber: </dt>
                      <dd className="inline">{a.source}</dd>
                    </div>
                  )}
                  {(a.nextStep || a.nextDate) && (
                    <div className="sm:col-span-2">
                      <dt className="inline text-slate-500">Berikutnya: </dt>
                      <dd className="inline">
                        {a.nextStep}
                        {a.nextStep && a.nextDate ? ", " : ""}
                        {formatDate(a.nextDate)}
                      </dd>
                    </div>
                  )}
                </dl>

                {staleDays >= STALE_DAYS && (
                  <p className="mt-2 text-sm font-medium text-amber-700">
                    Belum ada kabar selama {staleDays} hari. Pertimbangkan follow-up.
                  </p>
                )}

                {a.notes && <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{a.notes}</p>}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <form action={updateStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <select
                      name="status"
                      defaultValue={a.status}
                      aria-label={`Status lamaran ${a.company}`}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                      Ubah status
                    </button>
                  </form>
                  <div className="flex items-center gap-4">
                    <Link href={`/edit/${a.id}`} className="text-sm text-teal-700 hover:underline">
                      Edit
                    </Link>
                    <form action={deleteApplication}>
                      <input type="hidden" name="id" value={a.id} />
                      <DeleteButton label={a.company} />
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}