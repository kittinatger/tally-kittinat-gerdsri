"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";

const DELETE_CONFIRM_PHRASE = "I wish to delete this account";

type SecurityEvent = { event: string; created_at: string };

function describeSecurityEvent(event: string): string {
  if (event.startsWith("api_token_created:")) {
    return `Access token created ("${event.slice("api_token_created:".length).trim()}")`;
  }
  switch (event) {
    case "username_changed":
      return "Username changed";
    case "password_changed":
      return "Password changed";
    case "password_reset_via_email":
      return "Password reset via email link";
    case "email_changed":
      return "Email changed";
    case "email_removed":
      return "Email removed";
    case "signed_out_everywhere":
      return "Signed out of all devices";
    case "api_token_revoked":
      return "Access token revoked";
    case "login_succeeded":
      return "Signed in";
    default:
      return event;
  }
}

export default function AccountPanel({
  initialUsername,
  initialEmail,
}: {
  initialUsername: string;
  initialEmail: string | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);

  const [newUsername, setNewUsername] = useState(initialUsername);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const [newEmail, setNewEmail] = useState(initialEmail ?? "");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [signOutEverywhereOpen, setSignOutEverywhereOpen] = useState(false);
  const [signOutEverywherePassword, setSignOutEverywherePassword] = useState("");
  const [signingOutEverywhere, setSigningOutEverywhere] = useState(false);
  const [signOutEverywhereError, setSignOutEverywhereError] = useState<string | null>(null);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/security-events")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSecurityEvents(data.events ?? []);
      })
      .catch(() => {
        if (!cancelled) setSecurityEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);

    const trimmed = newEmail.trim();
    if (trimmed === (email ?? "")) {
      setEmailError("That's already the email on file.");
      return;
    }
    if (!emailPassword) {
      setEmailError("Enter your current password to confirm this change.");
      return;
    }

    setSavingEmail(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: trimmed, currentPassword: emailPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error ?? "Could not update email.");
        return;
      }
      setEmail(data.email);
      setNewEmail(data.email ?? "");
      setEmailPassword("");
      setEmailSuccess(true);
    } catch {
      setEmailError("Network error while saving.");
    } finally {
      setSavingEmail(false);
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

  async function handleSendResetLink() {
    if (!email) return;
    setSendingReset(true);
    setResetError(null);
    setResetSent(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setResetError("Could not send the reset link. Please try again.");
        return;
      }
      setResetSent(true);
    } catch {
      setResetError("Network error while sending.");
    } finally {
      setSendingReset(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function confirmLogout() {
    setConfirmingLogout(false);
    handleLogout();
  }

  async function handleSignOutEverywhere(e: React.FormEvent) {
    e.preventDefault();
    setSigningOutEverywhere(true);
    setSignOutEverywhereError(null);
    try {
      const res = await fetch("/api/account/sign-out-everywhere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: signOutEverywherePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignOutEverywhereError(data.error ?? "Could not sign out of all devices.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setSignOutEverywhereError("Network error while signing out.");
    } finally {
      setSigningOutEverywhere(false);
    }
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setDeleteAcknowledged(false);
    setDeletePhrase("");
    setDeletePassword("");
    setDeleteError(null);
  }

  const deleteReady = deleteAcknowledged && deletePhrase === DELETE_CONFIRM_PHRASE && deletePassword.length > 0;

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteReady) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Could not delete your account.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setDeleteError("Network error while deleting.");
    } finally {
      setDeleting(false);
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
        <p className="mt-1.5 text-xs text-ink-soft">Enter your current password to confirm this change.</p>
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

      <form onSubmit={handleEmailSubmit} className="mt-6 border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</p>
        <p className="mb-2.5 text-xs text-ink-soft">
          {email ? "Used to send password reset links." : "Add an email so you can reset your password if you forget it."}
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <input
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="Current password"
            className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        {emailError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>}
        {emailSuccess && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Email updated.</p>}
        <button
          type="submit"
          disabled={savingEmail}
          className="mt-3 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
        >
          {savingEmail ? "Saving..." : "Save email"}
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

        {email && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-xs text-ink-soft">
              Forgot your current password instead? Email yourself a reset link.
            </p>
            {resetError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{resetError}</p>}
            {resetSent ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Reset link sent to {email} — check your inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={sendingReset}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)] disabled:opacity-60"
              >
                {sendingReset ? "Sending..." : "Send reset link to my email"}
              </button>
            )}
          </div>
        )}
      </form>

      <div className="mt-6 border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Session</p>
        <button
          type="button"
          onClick={() => setConfirmingLogout(true)}
          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
        >
          <svg viewBox="0 0 32.5293 26.9238" fill="currentColor" className="h-[16px] w-[16px]">
            <path d="M22.6172 5.21484L22.6172 10.4004L20.8887 10.4004L20.8887 5.20508C20.8887 2.98828 19.6387 1.73828 17.4219 1.73828L6.85547 1.73828C4.62891 1.73828 3.38867 2.98828 3.38867 5.20508L3.38867 21.7188C3.38867 23.9453 4.62891 25.1953 6.85547 25.1953L17.4219 25.1953C19.6387 25.1953 20.8887 23.9453 20.8887 21.7188L20.8887 16.5137L22.6172 16.5137L22.6172 21.7188C22.6172 25.0684 20.7617 26.9238 17.4219 26.9238L6.86523 26.9238C3.51562 26.9238 1.65039 25.0684 1.65039 21.7188L1.65039 5.21484C1.65039 1.86523 3.51562 0.00976562 6.86523 0.00976562L17.4219 0.00976562C20.7617 0.00976562 22.6172 1.86523 22.6172 5.21484Z" />
            <path d="M12.334 13.457C12.334 13.916 12.7148 14.3066 13.1641 14.3066L26.2793 14.3066L29.3945 14.1797C29.7949 14.1602 30.127 13.8477 30.127 13.457C30.127 13.0566 29.7949 12.7441 29.3945 12.7246L26.2793 12.5977L13.1641 12.5977C12.7148 12.5977 12.334 12.9883 12.334 13.457ZM24.834 9.16992C24.834 9.375 24.9219 9.60938 25.0977 9.76562L27.3242 11.8848L28.9746 13.457L27.3242 15.0098L25.0977 17.1387C24.9219 17.2949 24.834 17.5195 24.834 17.7246C24.834 18.1641 25.1562 18.5059 25.5957 18.5059C25.8203 18.5059 25.9961 18.418 26.1621 18.252L30.2246 14.0723C30.4395 13.8574 30.5078 13.6719 30.5078 13.457C30.5078 13.2324 30.4395 13.0469 30.2246 12.832L26.1621 8.65234C25.9961 8.48633 25.8203 8.38867 25.5957 8.38867C25.1562 8.38867 24.834 8.7207 24.834 9.16992Z" />
          </svg>
          Sign out
        </button>
        <button
          type="button"
          onClick={() => setSignOutEverywhereOpen(true)}
          className="ml-2 flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
        >
          Sign out of all devices
        </button>
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Recent security activity</p>
        {securityEvents === null ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : securityEvents.length === 0 ? (
          <p className="text-sm text-ink-soft">No security-sensitive changes yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-surface-foreground-soft">
            {securityEvents.map((e, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="text-foreground">{describeSecurityEvent(e.event)}</span>
                <span className="shrink-0 text-xs text-ink-soft">{new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 border-t border-red-200 pt-4 dark:border-red-900/40">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
          Danger zone
        </p>
        <p className="mb-3 text-xs text-ink-soft">
          Permanently delete your account and all of its data. This can&apos;t be undone.
        </p>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Delete account
        </button>
      </div>

      {confirmingLogout && (
        <Modal onClose={() => setConfirmingLogout(false)} title="Sign out?">
          <p className="mb-5 text-sm text-surface-foreground-soft">
            You&apos;ll need to sign in again to view your expenses.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmingLogout(false)}
              className="rounded-full border border-surface-line px-4 py-2 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              disabled={loggingOut}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-red-700 disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </Modal>
      )}

      {signOutEverywhereOpen && (
        <Modal
          onClose={() => {
            setSignOutEverywhereOpen(false);
            setSignOutEverywherePassword("");
            setSignOutEverywhereError(null);
          }}
          title="Sign out of all devices?"
        >
          <form onSubmit={handleSignOutEverywhere} className="space-y-4">
            <p className="text-sm text-surface-foreground-soft">
              This signs out every device where you&apos;re currently logged in, including this one. You&apos;ll
              need to sign in again everywhere.
            </p>
            <div>
              <label htmlFor="signOutEverywherePassword" className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">
                Current password
              </label>
              <input
                id="signOutEverywherePassword"
                type="password"
                autoFocus
                value={signOutEverywherePassword}
                onChange={(e) => setSignOutEverywherePassword(e.target.value)}
                className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-sm text-surface-foreground outline-none transition focus:border-surface-accent focus:ring-2 focus:ring-surface-accent/20"
              />
            </div>
            {signOutEverywhereError && <p className="text-sm text-red-600 dark:text-red-400">{signOutEverywhereError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSignOutEverywhereOpen(false);
                  setSignOutEverywherePassword("");
                  setSignOutEverywhereError(null);
                }}
                className="rounded-full border border-surface-line px-4 py-2 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={signingOutEverywhere || !signOutEverywherePassword}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-red-700 disabled:opacity-60"
              >
                {signingOutEverywhere ? "Signing out..." : "Sign out everywhere"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteModalOpen && (
        <Modal onClose={closeDeleteModal} title="Delete account">
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <p className="text-sm text-surface-foreground-soft">
              This permanently deletes your account, including every transaction, category, receipt image, and
              setting. There is no way to recover this data afterward.
            </p>

            <label className="flex items-start gap-2.5 text-sm text-surface-foreground">
              <input
                type="checkbox"
                checked={deleteAcknowledged}
                onChange={(e) => setDeleteAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-line text-red-600 focus:ring-red-500"
              />
              I understand this action is permanent and all of my data will be lost.
            </label>

            <div>
              <label htmlFor="deletePhrase" className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">
                Type <span className="font-mono text-surface-foreground">{DELETE_CONFIRM_PHRASE}</span> to confirm
              </label>
              <input
                id="deletePhrase"
                type="text"
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                autoComplete="off"
                className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-sm text-surface-foreground outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label htmlFor="deletePassword" className="mb-1.5 block text-sm font-semibold text-surface-foreground-soft">
                Current password
              </label>
              <input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full rounded-card border border-surface-line bg-surface-soft px-3.5 py-2.5 text-sm text-surface-foreground outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-full border border-surface-line px-4 py-2 text-sm font-semibold text-surface-foreground transition hover:bg-[var(--surface-nav-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!deleteReady || deleting}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
