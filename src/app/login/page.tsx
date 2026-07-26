import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">
          T
        </div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Tally</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Sign in to view your expenses</p>
      </div>
      <LoginForm next={next ?? "/"} />
    </main>
  );
}
