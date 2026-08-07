import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { getAppOrigin } from "@/lib/app-url";
import {
  getUserByGithubId,
  getUserByUsername,
  getUserById,
  createUserFromGithub,
  linkGithubId,
  seedDefaultCategoriesForUser,
  seedDefaultWalletForUser,
  getSessionVersionForUser,
  logSecurityEvent,
} from "@/lib/db";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

// GitHub logins are already alphanumeric/hyphens, which fits our username
// pattern — but this defends against the edge cases the pattern doesn't
// (under the 3-char minimum, or GitHub returning something unexpected)
// rather than trusting an external API's output to already be valid.
function sanitizeUsername(login: string): string {
  const cleaned = login.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 32);
  const padded = cleaned.length >= 3 ? cleaned : `${cleaned}user`.slice(0, 32);
  return USERNAME_PATTERN.test(padded) ? padded : "github-user";
}

async function uniqueUsernameFrom(login: string): Promise<string> {
  const base = sanitizeUsername(login);
  let candidate = base;
  let suffix = 2;
  // Bounded rather than infinite — an attacker/bug can't wedge this into an
  // endless loop of DB round trips; past 50 taken variants something else
  // is wrong, and the caller falls back to a random handle instead.
  for (let attempts = 0; attempts < 50; attempts++) {
    const existing = await getUserByUsername(candidate);
    if (!existing) return candidate;
    const suffixStr = `-${suffix}`;
    candidate = `${base.slice(0, 32 - suffixStr.length)}${suffixStr}`;
    suffix++;
  }
  return `github-${Date.now().toString(36)}`;
}

// Shared by both flows GitHub can redirect back to here for: a fresh sign-in
// (initiated by /api/auth/github, no session yet) and linking GitHub to an
// account you're already signed into (initiated by /api/auth/github/link,
// which stashes which account in the github_oauth_link_user_id cookie
// checked below). Same callback URL either way — GitHub doesn't need to
// know the difference, only this handler does.
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const linkUserIdCookie = req.cookies.get("github_oauth_link_user_id")?.value;
  const linkUserId = linkUserIdCookie ? Number(linkUserIdCookie) : null;
  const isLinking = Number.isInteger(linkUserId) && (linkUserId as number) > 0;
  const failureUrl = new URL(isLinking ? "/settings" : "/login", req.url);
  // /login already has its own "error" query param convention (see
  // LoginForm.tsx); "githubError" for the /settings target avoids colliding
  // with anything else that might land there in the future.
  const errorParam = isLinking ? "githubError" : "error";

  const clearCookies = (res: NextResponse) => {
    res.cookies.set("github_oauth_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("github_oauth_link_user_id", "", { path: "/", maxAge: 0 });
    return res;
  };

  if (!clientId || !clientSecret) {
    failureUrl.searchParams.set(errorParam, "github_not_configured");
    return clearCookies(NextResponse.redirect(failureUrl));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("github_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    failureUrl.searchParams.set(errorParam, "github_failed");
    return clearCookies(NextResponse.redirect(failureUrl));
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${getAppOrigin(req)}/api/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = typeof tokenData?.access_token === "string" ? tokenData.access_token : null;
    if (!accessToken) {
      failureUrl.searchParams.set(errorParam, "github_failed");
      return clearCookies(NextResponse.redirect(failureUrl));
    }

    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    });
    if (!profileRes.ok) {
      failureUrl.searchParams.set(errorParam, "github_failed");
      return clearCookies(NextResponse.redirect(failureUrl));
    }
    const profile = await profileRes.json();
    const githubId = profile?.id !== undefined ? String(profile.id) : null;
    if (!githubId) {
      failureUrl.searchParams.set(errorParam, "github_failed");
      return clearCookies(NextResponse.redirect(failureUrl));
    }
    const githubLogin = typeof profile.login === "string" && profile.login ? profile.login : `github${githubId}`;

    if (isLinking) {
      const targetUserId = linkUserId as number;
      const target = await getUserById(targetUserId);
      if (!target) {
        failureUrl.searchParams.set(errorParam, "github_failed");
        return clearCookies(NextResponse.redirect(failureUrl));
      }
      const claimedBy = await getUserByGithubId(githubId);
      if (claimedBy && claimedBy.id !== targetUserId) {
        failureUrl.searchParams.set(errorParam, "github_link_conflict");
        return clearCookies(NextResponse.redirect(failureUrl));
      }
      if (!claimedBy) {
        await linkGithubId(targetUserId, githubId);
        await logSecurityEvent(targetUserId, "github_account_linked");
      }
      // else: this GitHub account is already linked to this same Tally
      // account (re-linking, or a duplicate callback) — nothing to do.
      const successUrl = new URL("/settings", req.url);
      successUrl.searchParams.set("githubLinked", "1");
      return clearCookies(NextResponse.redirect(successUrl));
    }

    const existing = await getUserByGithubId(githubId);
    let userId: number;
    if (existing) {
      userId = existing.id;
    } else {
      const username = await uniqueUsernameFrom(githubLogin);
      let created: { id: number; username: string } | null = null;
      try {
        created = await createUserFromGithub(username, githubId);
      } catch (err) {
        // Only realistic cause left after uniqueUsernameFrom: a duplicate
        // github_id from a concurrent sign-in racing this same request.
        if (isUniqueViolation(err)) {
          created = await getUserByGithubId(githubId);
        }
        if (!created) throw err;
      }
      userId = created.id;
      await seedDefaultCategoriesForUser(userId);
      await seedDefaultWalletForUser(userId);
      await logSecurityEvent(userId, "github_account_created");
    }

    const sessionVersion = await getSessionVersionForUser(userId);
    const token = await createSessionToken(userId, sessionVersion);
    await logSecurityEvent(userId, "login_succeeded");

    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    return clearCookies(res);
  } catch (err) {
    console.error("GitHub OAuth callback failed:", err);
    failureUrl.searchParams.set(errorParam, "github_failed");
    return clearCookies(NextResponse.redirect(failureUrl));
  }
}
