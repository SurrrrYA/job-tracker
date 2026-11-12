import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/ui";

export const dynamic = "force-dynamic";

function cell(value: string | null): string {
  const text = value ?? "";
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function day(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export async function GET() {
  const rows = await prisma.application.findMany({
    orderBy: { appliedAt: "desc" },
  });

  const header = [
    "Perusahaan",
    "Posisi",
    "Status",
    "Sumber",
    "Tanggal melamar",
    "Langkah berikutnya",
    "Tanggal langkah berikutnya",
    "Catatan",
  ];

  const lines = rows.map((a) =>
    [
      a.company,
      a.position,
      STATUS_LABEL[a.status],
      a.source,
      day(a.appliedAt),
      a.nextStep,
      day(a.nextDate),
      a.notes,
    ]
      .map(cell)
      .join(",")
  );

  // BOM di depan supaya Excel membaca huruf dengan benar
  const csv = "\uFEFF" + [header.join(","), ...lines].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lamaran-kerja.csv"',
    },
  });
}