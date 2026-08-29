// Split out from admin.ts specifically so this constant can be imported by
// client components (e.g. SettingsNavList, to decide whether to show the
// Template Reviews nav item) without pulling admin.ts's `db.ts` import —
// and its Postgres connection pool — into the client bundle. Only this
// file is client-safe; isAdminUser (admin.ts) is server-only.
export const ADMIN_EMAIL = "kittinatg@gmail.com";
