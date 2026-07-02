"use client";

import { useEffect } from "react";

/**
 * Safety net for OAuth sign-in.
 *
 * If a provider (or Supabase falling back to the Site URL) drops an OAuth
 * `?code=` on a page that can't process it — e.g. the landing page or any
 * route other than the server callback — this forwards it to
 * `/auth/callback` on the SAME host, so the PKCE code-verifier cookie matches
 * and the exchange succeeds. Without this, the code is silently ignored and
 * the user appears "logged out on the landing page."
 */
export default function OAuthCodeCatcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { pathname, search } = window.location;

    // The server callback already handles the exchange; never loop back to it.
    if (pathname.startsWith("/auth/callback")) return;

    const params = new URLSearchParams(search);
    if (params.has("code")) {
      window.location.replace(`/auth/callback${search}`);
    }
  }, []);

  return null;
}
