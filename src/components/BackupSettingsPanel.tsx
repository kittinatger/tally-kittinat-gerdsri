"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { describeFetchError } from "@/lib/fetch-error";
import { encryptBackup, decryptBackup, type BackupEnvelope } from "@/lib/backup/crypto";
import { useT } from "@/lib/language-context";

type ImportResult = { imported: Record<string, number>; skipped: Record<string, number>; errors: string[] };

function totalCount(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

export default function BackupSettingsPanel() {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportConfirm, setExportConfirm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDone, setExportDone] = useState(false);

  const [importPassphrase, setImportPassphrase] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  async function handleExport() {
    setExportError(null);
    setExportDone(false);
    if (exportPassphrase.length < 8) {
      setExportError(t("backup.export.tooShort"));
      return;
    }
    if (exportPassphrase !== exportConfirm) {
      setExportError(t("backup.export.mismatch"));
      return;
    }
    setExporting(true);
    try {
      const res = await fetch("/api/backup/export");
      if (!res.ok) {
        setExportError(t("backup.export.failed"));
        return;
      }
      const payload = await res.json();
      const envelope = await encryptBackup(payload, exportPassphrase);
      const blob = new Blob([JSON.stringify(envelope)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tally-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setExportPassphrase("");
      setExportConfirm("");
    } catch (err) {
      setExportError(describeFetchError(err));
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!pendingFile) return;
    setImportError(null);
    setImportResult(null);
    setImporting(true);
    try {
      const text = await pendingFile.text();
      let envelope: BackupEnvelope;
      try {
        envelope = JSON.parse(text);
      } catch {
        setImportError(t("backup.import.notABackup"));
        return;
      }
      const payload = (await decryptBackup(envelope, importPassphrase)) as { tables?: Record<string, unknown[]> };
      if (!payload || typeof payload !== "object" || !payload.tables) {
        setImportError(t("backup.import.notABackup"));
        return;
      }
      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: payload.tables }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(typeof data.error === "string" ? data.error : t("backup.import.failed"));
        return;
      }
      setImportResult(data);
      if (totalCount(data.imported) > 0) router.refresh();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : describeFetchError(err));
    } finally {
      setImporting(false);
      setPendingFile(null);
      setImportPassphrase("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h3 className="font-display text-2xl text-foreground">{t("backup.title")}</h3>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="text-sm font-semibold text-foreground">{t("backup.export.title")}</h4>
        <p className="mt-1 text-xs leading-snug text-ink-soft">{t("backup.export.description")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <input
            type="password"
            value={exportPassphrase}
            onChange={(e) => setExportPassphrase(e.target.value)}
            placeholder={t("backup.export.passphrasePlaceholder")}
            className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
          />
          <input
            type="password"
            value={exportConfirm}
            onChange={(e) => setExportConfirm(e.target.value)}
            placeholder={t("backup.export.confirmPlaceholder")}
            className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
          />
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="self-start rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
          >
            {exporting ? t("backup.export.exporting") : t("backup.export.button")}
          </button>
          {exportError && <p className="text-xs text-red-600 dark:text-red-400">{exportError}</p>}
          {exportDone && <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("backup.export.done")}</p>}
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h4 className="text-sm font-semibold text-foreground">{t("backup.import.title")}</h4>
        <p className="mt-1 text-xs leading-snug text-ink-soft">{t("backup.import.description")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
            className="text-xs text-ink-soft file:mr-3 file:rounded-full file:border file:border-line file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
          />
          {pendingFile && (
            <>
              <input
                type="password"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                placeholder={t("backup.import.passphrasePlaceholder")}
                className="w-full rounded-input border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-surface-accent"
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !importPassphrase}
                className="self-start rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
              >
                {importing ? t("backup.import.importing") : t("backup.import.button")}
              </button>
            </>
          )}
          {importError && <p className="text-xs text-red-600 dark:text-red-400">{importError}</p>}
          {importResult && (
            <p className="text-xs text-ink-soft">
              {t("backup.import.resultPrefix")} {totalCount(importResult.imported)}
              {totalCount(importResult.skipped) > 0 ? ` · ${t("backup.import.skippedLabel")} ${totalCount(importResult.skipped)}` : ""}
              {importResult.errors.length > 0 ? ` · ${importResult.errors[0]}` : ""}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
