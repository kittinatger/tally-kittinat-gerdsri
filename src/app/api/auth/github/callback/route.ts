import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import {
  getUserByGithubId,
  getUserByUsername,
  createUserFromGithub,
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

// Step 2: GitHub redirects back here with a one-time `code`. Exchange it for
// an access token, fetch the profile, and find-or-create the matching Tally
// account. Deliberately matches only by github_id (not by any email GitHub
// might return) — linking a GitHub sign-in to an existing username/password
// account is a separate, not-yet-built flow (see Settings > Account), so a
// GitHub sign-in always lands on its own account today, never merges with
// one you already have.
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const loginUrl = new URL("/login", req.url);

  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "github_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("github_oauth_state")?.value;

  const clearStateCookie = (res: NextResponse) => {
    res.cookies.set("github_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  };

  if (!code || !state || !cookieState || state !== cookieState) {
    loginUrl.searchParams.set("error", "github_failed");
    return clearStateCookie(NextResponse.redirect(loginUrl));
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${req.nextUrl.origin}/api/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = typeof tokenData?.access_token === "string" ? tokenData.access_token : null;
    if (!accessToken) {
      loginUrl.searchParams.set("error", "github_failed");
      return clearStateCookie(NextResponse.redirect(loginUrl));
    }

    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
    });
    if (!profileRes.ok) {
      loginUrl.searchParams.set("error", "github_failed");
      return clearStateCookie(NextResponse.redirect(loginUrl));
    }
    const profile = await profileRes.json();
    const githubId = profile?.id !== undefined ? String(profile.id) : null;
    if (!githubId) {
      loginUrl.searchParams.set("error", "github_failed");
      return clearStateCookie(NextResponse.redirect(loginUrl));
    }
    const githubLogin = typeof profile.login === "string" && profile.login ? profile.login : `github${githubId}`;

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
    return clearStateCookie(res);
  } catch (err) {
    console.error("GitHub OAuth callback failed:", err);
    loginUrl.searchParams.set("error", "github_failed");
    return clearStateCookie(NextResponse.redirect(loginUrl));
  }
}
