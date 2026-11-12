import { Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STATUS_BADGE, STATUS_LABEL, STATUS_ORDER, todayJakarta } from "@/lib/ui";

export const dynamic = "force-dynamic";

const ADVANCED: Status[] = [Status.TEST, Status.INTERVIEW, Status.OFFER];
const IN_PROGRESS: Status[] = [Status.APPLIED, Status.TEST, Status.INTERVIEW];

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function lastMonths(count: number): string[] {
  const [year, month] = todayJakarta().split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-teal-700" style={{ width: `${width}%` }} />
    </div>
  );
}

export default async function StatistikPage() {
  const all = await prisma.application.findMany();
  const total = all.length;

  const byStatus = STATUS_ORDER.map((s) => ({
    status: s,
    count: all.filter((a) => a.status === s).length,
  }));
  const maxStatus = Math.max(...byStatus.map((x) => x.count), 0);

  const months = lastMonths(6);
  const monthCounts = new Map<string, number>();
  for (const a of all) {
    const key = monthKey(a.appliedAt);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const byMonth = months.map((key) => ({ key, count: monthCounts.get(key) ?? 0 }));
  const maxMonth = Math.max(...byMonth.map((x) => x.count), 0);

  const sources = new Map<string, { label: string; total: number; advanced: number }>();
  for (const a of all) {
    const label = a.source?.trim() || "Tanpa sumber";
    const key = label.toLowerCase();
    const entry = sources.get(key) ?? { label, total: 0, advanced: 0 };
    entry.total += 1;
    if (ADVANCED.includes(a.status)) entry.advanced += 1;
    sources.set(key, entry);
  }
  const bySource = [...sources.values()].sort((a, b) => b.total - a.total);

  const inProgress = all.filter((a) => IN_PROGRESS.includes(a.status)).length;
  const offers = all.filter((a) => a.status === Status.OFFER).length;
  const rejected = all.filter((a) => a.status === Status.REJECTED).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Statistik</h1>
        <p className="mt-1 text-sm text-slate-600">
          Dihitung dari status lamaran saat ini.
        </p>
      </header>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-600">
          Belum ada data. Tambahkan lamaran di halaman daftar, lalu statistiknya muncul di sini.
        </p>
      ) : (
        <div className="space-y-8">
          <section aria-label="Ringkasan" className="rounded-lg border border-slate-200 bg-white p-4">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-slate-600">Total lamaran</dt>
                <dd className="text-2xl font-semibold">{total}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Masih berjalan</dt>
                <dd className="text-2xl font-semibold">{inProgress}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Penawaran</dt>
                <dd className="text-2xl font-semibold">{offers}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Ditolak</dt>
                <dd className="text-2xl font-semibold">{rejected}</dd>
              </div>
            </dl>
          </section>

          <section aria-label="Lamaran per tahap" className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-medium">Per tahap</h2>
            <ul className="mt-4 space-y-3">
              {byStatus.map(({ status, count }) => (
                <li key={status} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                  <Bar value={count} max={maxStatus} />
                  <span className="text-right font-medium">{count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Lamaran per bulan" className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-medium">Per bulan melamar (6 bulan terakhir)</h2>
            <ul className="mt-4 space-y-3">
              {byMonth.map(({ key, count }) => (
                <li key={key} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="text-slate-700">{monthLabel(key)}</span>
                  <Bar value={count} max={maxMonth} />
                  <span className="text-right font-medium">{count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Lamaran per sumber" className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-medium">Per sumber lowongan</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="py-2 pr-4 font-medium">Sumber</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">Lamaran</th>
                    <th scope="col" className="py-2 text-right font-medium">Di tahap tes, interview, atau penawaran</th>
                  </tr>
                </thead>
                <tbody>
                  {bySource.map((row) => (
                    <tr key={row.label} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4">{row.label}</td>
                      <td className="py-2 pr-4 text-right">{row.total}</td>
                      <td className="py-2 text-right">{row.advanced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-sm text-slate-600">
            Aplikasi ini hanya menyimpan status saat ini, bukan riwayat perubahannya. Lamaran yang
            pernah sampai interview lalu ditolak tercatat sebagai Ditolak, jadi angka di kolom
            terakhir tabel sumber hanya menghitung yang masih berada di tahap tersebut.
          </p>
        </div>
      )}
    </main>
  );
}