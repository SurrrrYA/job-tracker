import { INPUT_CLASS } from "@/lib/ui";
import { login } from "../auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 text-slate-900">
      <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
      <p className="mt-1 text-sm text-slate-600">Pelacak lamaran kerja pribadi.</p>

      <form action={login} className="mt-6 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-700">Kata sandi</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            className={INPUT_CLASS}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-700">
            Kata sandi salah. Coba lagi.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Masuk
        </button>
      </form>
    </main>
  );
}