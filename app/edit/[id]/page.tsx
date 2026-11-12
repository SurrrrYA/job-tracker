import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  INPUT_CLASS,
  STATUS_LABEL,
  STATUS_ORDER,
  toDateInput,
} from "@/lib/ui";
import { updateApplication } from "../../actions";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const application = await prisma.application.findUnique({
    where: { id: numericId },
  });
  if (!application) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
      <Link href="/" className="text-sm text-teal-700 hover:underline">
        Kembali ke daftar
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit lamaran</h1>
      <p className="mt-1 text-sm text-slate-600">
        {application.company}, {application.position}
      </p>

      <form
        action={updateApplication}
        className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={application.id} />
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Perusahaan</span>
          <input name="company" required defaultValue={application.company} className={INPUT_CLASS} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Posisi</span>
          <input name="position" required defaultValue={application.position} className={INPUT_CLASS} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Status</span>
          <select name="status" defaultValue={application.status} className={INPUT_CLASS}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Sumber lowongan</span>
          <input name="source" defaultValue={application.source ?? ""} className={INPUT_CLASS} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Tanggal melamar</span>
          <input type="date" name="appliedAt" defaultValue={toDateInput(application.appliedAt)} className={INPUT_CLASS} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Tanggal langkah berikutnya</span>
          <input type="date" name="nextDate" defaultValue={toDateInput(application.nextDate)} className={INPUT_CLASS} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-700">Langkah berikutnya</span>
          <input name="nextStep" defaultValue={application.nextStep ?? ""} className={INPUT_CLASS} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-700">Catatan</span>
          <textarea name="notes" rows={4} defaultValue={application.notes ?? ""} className={INPUT_CLASS} />
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Simpan perubahan
          </button>
          <Link href="/" className="text-sm text-slate-600 hover:underline">
            Batal
          </Link>
        </div>
      </form>
    </main>
  );
}