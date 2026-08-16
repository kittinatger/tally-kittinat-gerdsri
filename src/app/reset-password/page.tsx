import ResetPasswordForm from "@/components/ResetPasswordForm";
import SettingsMenu from "@/components/SettingsMenu";
import T from "@/components/T";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <SettingsMenu />
      </div>
      <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/favicon-light.svg" alt="Tally" className="h-14 w-14 dark:hidden" />
        <img src="/favicon-dark.svg" alt="Tally" className="hidden h-14 w-14 dark:block" />
        <h1 className="font-display text-2xl text-foreground">
          <T k="resetPassword.title" />
        </h1>
      </div>
      <ResetPasswordForm token={token ?? ""} />
    </main>
  );
}
