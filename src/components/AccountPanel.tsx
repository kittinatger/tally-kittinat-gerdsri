"use client";

import { useState } from "react";

export default function AccountPanel({ initialUsername }: { initialUsername: string }) {
  const [username, setUsername] = useState(initialUsername);

  const [newUsername, setNewUsername] = useState(initialUsername);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);

    if (newUsername.trim() === username) {
      setUsernameError("That's already your username.");
      return;
    }
    if (!usernamePassword) {
      setUsernameError("Enter your current password to confirm this change.");
      return;
    }

    setSavingUsername(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername: newUsername.trim(), currentPassword: usernamePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error ?? "Could not update username.");
        return;
      }
      setUsername(data.username);
      setNewUsername(data.username);
      setUsernamePassword("");
      setUsernameSuccess(true);
    } catch {
      setUsernameError("Network error while saving.");
    } finally {
      setSavingUsername(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Could not update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch {
      setPasswordError("Network error while saving.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h3 className="mb-1 font-display text-xl text-foreground">Your account</h3>
      <p className="mb-4 text-sm text-ink-soft">
        Signed in as <span className="font-semibold text-foreground">{username}</span>
      </p>

      <form onSubmit={handleUsernameSubmit} className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Change username</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="New username"
            className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <input
            type="password"
            value={usernamePassword}
            onChange={(e) => setUsernamePassword(e.target.value)}
            placeholder="Current password"
            className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        {usernameError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{usernameError}</p>}
        {usernameSuccess && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Username updated.</p>}
        <button
          type="submit"
          disabled={savingUsername}
          className="mt-3 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
        >
          {savingUsername ? "Saving..." : "Save username"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="mt-6 border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Change password</p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            minLength={8}
            className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            minLength={8}
            className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        {passwordError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
        {passwordSuccess && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Password updated.</p>}
        <button
          type="submit"
          disabled={savingPassword}
          className="mt-3 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
        >
          {savingPassword ? "Saving..." : "Save password"}
        </button>
      </form>
    </div>
  );
}
