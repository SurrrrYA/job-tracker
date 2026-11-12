"use client";

export default function DeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!confirm(`Hapus lamaran ${label}? Tindakan ini tidak bisa dibatalkan.`)) {
          event.preventDefault();
        }
      }}
      className="text-sm text-rose-700 hover:underline"
    >
      Hapus
    </button>
  );
}