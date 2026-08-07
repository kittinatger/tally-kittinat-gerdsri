"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { describeFetchError } from "@/lib/fetch-error";

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
    case "github_account_created":
      return "Account created via GitHub";
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
  // Accounts created via GitHub (or another OAuth provider, once added)
  // have no password — assume true (the common case) until the real value
  // loads, so the password fields don't flash in and back out.
  const [hasPassword, setHasPassword] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.hasPassword === "boolean") setHasPassword(data.hasPassword);
      })
      .catch(() => {
        // Leave the default (assume a password exists) — worst case an
        // OAuth-only user sees an unnecessary "current password" field.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Each row below is view-only until you tap Edit — collapsing the three
  // always-open forms this panel used to show at once (username, email,
  // password) into one line each by default, matching how the rest of
  // Settings works elsewhere in the app.
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);

    if (newUsername.trim() === username) {
      setUsernameError("That's already your username.");
      return;
    }
    if (hasPassword && !usernamePassword) {
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
      setEditingUsername(false);
    } catch (err) {
      setUsernameError(describeFetchError(err));
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
    if (hasPassword && !emailPassword) {
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
      setEditingEmail(false);
    } catch (err) {
      setEmailError(describeFetchError(err));
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
      setEditingPassword(false);
    } catch (err) {
      setPasswordError(describeFetchError(err));
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
    } catch (err) {
      setResetError(describeFetchError(err));
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
    } catch (err) {
      setSignOutEverywhereError(describeFetchError(err));
    } finally {
      setSigningOutEverywhere(false);
    }
  }

  function cancelUsernameEdit() {
    setEditingUsername(false);
    setNewUsername(username);
    setUsernamePassword("");
    setUsernameError(null);
  }

  function cancelEmailEdit() {
    setEditingEmail(false);
    setNewEmail(email ?? "");
    setEmailPassword("");
    setEmailError(null);
  }

  function cancelPasswordEdit() {
    setEditingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setDeleteAcknowledged(false);
    setDeletePhrase("");
    setDeletePassword("");
    setDeleteError(null);
  }

  const deleteReady =
    deleteAcknowledged && deletePhrase === DELETE_CONFIRM_PHRASE && (!hasPassword || deletePassword.length > 0);

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
    } catch (err) {
      setDeleteError(describeFetchError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Profile: username + email, each a compact view-only row until you
          tap Edit — was two always-open forms taking up most of the panel
          before you'd touched anything. */}
      <div className="rounded-card border border-line bg-surface p-5">
        <h3 className="mb-4 font-display text-xl text-foreground">Profile</h3>

        <div className={editingUsername ? "" : "flex items-center justify-between gap-3"}>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Username</p>
            {!editingUsername && <p className="mt-0.5 truncate text-sm text-foreground">{username}</p>}
          </div>
          {!editingUsername && (
            <button
              type="button"
              onClick={() => setEditingUsername(true)}
              className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
            >
              Edit
            </button>
          )}
        </div>
        {editingUsername && (
          <form onSubmit={handleUsernameSubmit} className="mt-2">
            <div className={`grid gap-2.5 ${hasPassword ? "sm:grid-cols-2" : ""}`}>
              <input
                autoFocus
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="New username"
                className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
              {hasPassword && (
                <input
                  type="password"
                  value={usernamePassword}
                  onChange={(e) => setUsernamePassword(e.target.value)}
                  placeholder="Current password"
                  className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
              )}
            </div>
            {hasPassword && (
              <p className="mt-1.5 text-xs text-ink-soft">Enter your current password to confirm this change.</p>
            )}
            {usernameError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{usernameError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={savingUsername}
                className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
              >
                {savingUsername ? "Saving..." : "Save username"}
              </button>
              <button
                type="button"
                onClick={cancelUsernameEdit}
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {usernameSuccess && !editingUsername && (
          <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">Username updated.</p>
        )}

        <div className={`mt-4 border-t border-line pt-4 ${editingEmail ? "" : "flex items-center justify-between gap-3"}`}>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</p>
            {!editingEmail && (
              <p className="mt-0.5 truncate text-sm text-foreground">{email ?? "Not set"}</p>
            )}
          </div>
          {!editingEmail && (
            <button
              type="button"
              onClick={() => setEditingEmail(true)}
              className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
            >
              {email ? "Edit" : "Add"}
            </button>
          )}
        </div>
        {!editingEmail && !email && (
          <p className="mt-1 text-xs text-ink-soft">Add an email so you can reset your password if you forget it.</p>
        )}
        {editingEmail && (
          <form onSubmit={handleEmailSubmit} className="mt-2">
            <div className={`grid gap-2.5 ${hasPassword ? "sm:grid-cols-2" : ""}`}>
              <input
                autoFocus
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
              {hasPassword && (
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Current password"
                  className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
              )}
            </div>
            {emailError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={savingEmail}
                className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
              >
                {savingEmail ? "Saving..." : "Save email"}
              </button>
              <button
                type="button"
                onClick={cancelEmailEdit}
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {emailSuccess && !editingEmail && (
          <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">Email updated.</p>
        )}
      </div>

      {/* Password: same view-row/Edit pattern. For OAuth-only accounts this
          becomes "Set a password" instead of "Change password". */}
      <div className="rounded-card border border-line bg-surface p-5">
        <div className={editingPassword ? "" : "flex items-center justify-between gap-3"}>
          <div className="min-w-0">
            <h3 className="font-display text-xl text-foreground">Password</h3>
            {!editingPassword && (
              <p className="mt-0.5 text-sm text-ink-soft">
                {hasPassword ? "••••••••" : "No password set — signed in with GitHub"}
              </p>
            )}
          </div>
          {!editingPassword && (
            <button
              type="button"
              onClick={() => setEditingPassword(true)}
              className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
            >
              {hasPassword ? "Change" : "Set password"}
            </button>
          )}
        </div>

        {editingPassword && (
          <form onSubmit={handlePasswordSubmit} className="mt-3">
            {!hasPassword && (
              <p className="mb-2.5 text-xs text-ink-soft">
                Set a password so you can also sign in with a username and password, not just GitHub.
              </p>
            )}
            <div className={`grid gap-2.5 ${hasPassword ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              {hasPassword && (
                <input
                  autoFocus
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="rounded-card border border-line bg-bg-soft px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
              )}
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-navy-dark disabled:opacity-60"
              >
                {savingPassword ? "Saving..." : hasPassword ? "Save password" : "Set password"}
              </button>
              <button
                type="button"
                onClick={cancelPasswordEdit}
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground"
              >
                Cancel
              </button>
              {hasPassword && email && (
                <span className="text-xs text-ink-soft">
                  Forgot it instead?{" "}
                  {resetSent ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Reset link sent — check your inbox.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendResetLink}
                      disabled={sendingReset}
                      className="font-semibold text-navy underline hover:no-underline disabled:opacity-60 dark:text-blue-300"
                    >
                      {sendingReset ? "Sending..." : "Email me a reset link"}
                    </button>
                  )}
                </span>
              )}
            </div>
            {resetError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{resetError}</p>}
          </form>
        )}
        {passwordSuccess && !editingPassword && (
          <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">Password updated.</p>
        )}
      </div>

      {/* Sessions */}
      <div className="rounded-card border border-line bg-surface p-5">
        <h3 className="mb-3 font-display text-xl text-foreground">Sessions</h3>
        <div className="flex flex-wrap gap-2">
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
            className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--nav-hover-bg)]"
          >
            Sign out of all devices
          </button>
        </div>
      </div>

      {/* Recent security activity — collapsed by default, since it's a
          record to check on rather than something to see every visit. */}
      <div className="rounded-card border border-line bg-surface p-5">
        <button
          type="button"
          onClick={() => setActivityOpen((o) => !o)}
          aria-expanded={activityOpen}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <h3 className="font-display text-xl text-foreground">Recent security activity</h3>
          <svg
            viewBox="0 0 21.6895 12.959"
            fill="currentColor"
            className={`h-3.5 w-3.5 shrink-0 text-ink-soft transition-transform ${activityOpen ? "rotate-180" : ""}`}
          >
            <path d="M10.6641 12.959C10.9473 12.959 11.2109 12.832 11.4062 12.6172L21.0352 2.58789C21.2207 2.40234 21.3281 2.16797 21.3281 1.89453C21.3281 1.34766 20.9082 0.927734 20.3516 0.927734C20.0977 0.927734 19.8438 1.02539 19.6582 1.20117L10.0684 11.1816L11.2695 11.1816L1.66016 1.20117C1.48438 1.02539 1.24023 0.927734 0.976562 0.927734C0.419922 0.927734 0 1.34766 0 1.89453C0 2.16797 0.117188 2.40234 0.292969 2.59766L9.92188 12.627C10.1367 12.832 10.3809 12.959 10.6641 12.959Z" />
          </svg>
        </button>
        {activityOpen && (
          <div className="mt-3 border-t border-line pt-3">
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
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-card border border-red-200 bg-surface p-5 dark:border-red-900/40">
        <h3 className="mb-1 font-display text-xl text-red-600 dark:text-red-400">Danger zone</h3>
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
            {hasPassword && (
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
            )}
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
                disabled={signingOutEverywhere || (hasPassword && !signOutEverywherePassword)}
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

            {hasPassword && (
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
            )}

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
