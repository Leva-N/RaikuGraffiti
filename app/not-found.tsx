import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <p className="opacity-80">Такой страницы нет.</p>
      <Link
        href="/"
        className="rounded-md bg-[var(--wall-brick)] px-4 py-2 text-white hover:opacity-90"
      >
        На главную
      </Link>
    </main>
  );
}
