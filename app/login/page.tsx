"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const C_PAPER = "#faf8f3";
const C_INK = "#2c2c2c";
const C_INK_SOFT = "#5c4a2a";
const C_BROWN = "#8b7355";
const C_BROWN_SOFT = "#c9b99a";
const C_PAPER_DEEP = "#f0ebe0";
const C_GOLD = "#d4a853";
const FONT_SERIF = "'Noto Serif JP', serif";
const FONT_SANS = "'Noto Sans JP', sans-serif";

function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/";
  const paramError = params.get("error");

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(paramError);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      redirectTo
    )}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim()) return;
    setLoading(true);
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      redirectTo
    )}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback },
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage("メールをご確認ください。リンクをクリックするとログインできます。");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-10"
      style={{ background: C_PAPER, color: C_INK, fontFamily: FONT_SANS }}
    >
      <div
        className="w-full max-w-md p-8"
        style={{
          background: C_PAPER,
          border: `1px solid ${C_BROWN_SOFT}`,
          borderRadius: 4,
        }}
      >
        <div className="mb-6" style={{ borderBottom: `1px solid ${C_BROWN_SOFT}` }}>
          <h1
            className="pb-2 text-2xl"
            style={{ fontFamily: FONT_SERIF, fontWeight: 700, color: C_INK, letterSpacing: "0.03em" }}
          >
            Mandala KDI
          </h1>
          <p
            className="pb-3 text-xs"
            style={{ color: C_INK_SOFT, fontFamily: FONT_SERIF, letterSpacing: "0.05em" }}
          >
            ― sign in to your notebook ―
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm transition disabled:opacity-60 hover:bg-[#f5f0e3]"
          style={{
            background: C_PAPER,
            color: C_INK,
            border: `1px solid ${C_BROWN}`,
            borderRadius: 4,
            fontFamily: FONT_SERIF,
            fontWeight: 500,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.8-3.2-11.3-7.7l-6.5 5C9.5 39.7 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C40.9 35 44 29.9 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>
          Googleでサインイン
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1" style={{ borderTop: `1px solid ${C_BROWN_SOFT}` }} />
          <span
            className="text-[10px]"
            style={{ color: C_BROWN, fontFamily: FONT_SERIF, letterSpacing: "0.1em" }}
          >
            OR
          </span>
          <div className="flex-1" style={{ borderTop: `1px solid ${C_BROWN_SOFT}` }} />
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label
              className="mb-1.5 block text-xs"
              style={{ color: C_INK_SOFT, fontFamily: FONT_SERIF, fontWeight: 500 }}
            >
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none"
              style={{
                borderBottom: `1px solid ${C_BROWN}`,
                color: C_INK,
                fontFamily: FONT_SANS,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full px-4 py-2.5 text-sm transition disabled:opacity-60 hover:opacity-90"
            style={{
              background: C_INK,
              color: C_PAPER,
              border: `1px solid ${C_INK}`,
              borderRadius: 4,
              fontFamily: FONT_SERIF,
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            {loading ? "送信中…" : "マジックリンクを送る"}
          </button>
        </form>

        {message && (
          <div
            className="mt-5 px-3 py-2 text-xs"
            style={{
              background: C_PAPER_DEEP,
              color: C_INK_SOFT,
              borderLeft: `3px solid ${C_GOLD}`,
              fontFamily: FONT_SANS,
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            className="mt-5 px-3 py-2 text-xs"
            style={{
              background: "#fdf0f0",
              color: "#b84444",
              borderLeft: `3px solid #b84444`,
              fontFamily: FONT_SANS,
            }}
          >
            {error}
          </div>
        )}

        <p
          className="mt-8 text-center text-[10px]"
          style={{ color: C_BROWN, fontFamily: FONT_SERIF, letterSpacing: "0.1em" }}
        >
          ― turn the page, begin your mandala ―
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: C_PAPER, minHeight: "100dvh" }} />}>
      <LoginForm />
    </Suspense>
  );
}
