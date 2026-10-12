"use client";

import { useEffect, useId, useRef, useState } from "react";
import { loadRecaptcha, type RecaptchaApi } from "@/lib/recaptcha";
import { navigateToDiscord, parseDiscordInvite } from "@/lib/discord-invite";
import { withBasePath } from "@/lib/asset-path";

type Phase =
  "idle" | "loading" | "challenge" | "submitting" | "failed" | "redirecting";

export function JoinVerification({
  siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "",
}: {
  siteKey?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState(
    "参加申請の前に、人による操作であることを確認します。",
  );
  const container = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const api = useRef<RecaptchaApi | null>(null);
  const widget = useRef<number | null>(null);
  const request = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const loadAttempt = useRef(0);
  const id = useId();
  const configured = Boolean(siteKey.trim());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      if (widget.current !== null) api.current?.reset(widget.current);
    };
  }, []);

  function invalidate(text: string, failed = false) {
    if (!mounted.current) return;
    epoch.current++;
    request.current?.abort();
    request.current = null;
    setToken("");
    setPhase(failed ? "failed" : "challenge");
    setMessage(text);
  }

  async function start() {
    if (!configured || phase === "loading") return;
    const attempt = ++loadAttempt.current;
    setPhase("loading");
    setMessage("認証を読み込んでいます…");
    try {
      const recaptcha = await loadRecaptcha();
      if (
        !mounted.current ||
        attempt !== loadAttempt.current ||
        !container.current
      )
        return;
      api.current = recaptcha;
      if (widget.current !== null) recaptcha.reset(widget.current);
      else
        widget.current = recaptcha.render(container.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "compact",
          callback: (value) => {
            if (!mounted.current) return;
            setToken(value);
            setPhase("challenge");
            setMessage(
              "認証を受け取りました。参加申請ボタンから進んでください。",
            );
          },
          "expired-callback": () =>
            invalidate("認証の期限が切れました。もう一度認証してください。"),
          "error-callback": () =>
            invalidate(
              "認証に接続できませんでした。もう一度お試しください。",
              true,
            ),
        });
      setPhase("challenge");
      setMessage("チェックボックスで認証してください。");
    } catch {
      if (mounted.current && attempt === loadAttempt.current) {
        setPhase("failed");
        setMessage("認証を読み込めませんでした。もう一度お試しください。");
      }
    }
  }

  async function submit() {
    if (!token || request.current || phase !== "challenge") return;
    const controller = new AbortController();
    request.current = controller;
    const current = ++epoch.current;
    setPhase("submitting");
    setMessage("認証を確認しています…");
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(withBasePath("/api/join"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Verification rejected");
      const data: unknown = await response.json();
      const url = parseDiscordInvite(
        typeof data === "object" && data !== null && "url" in data
          ? data.url
          : null,
      );
      if (!url) throw new Error("Invalid invitation");
      if (
        !mounted.current ||
        epoch.current !== current ||
        controller.signal.aborted
      )
        return;
      setToken("");
      setPhase("redirecting");
      setMessage("Discordへ移動します…");
      navigateToDiscord(url);
    } catch {
      if (mounted.current && epoch.current === current) {
        setToken("");
        setPhase("challenge");
        setMessage("確認できませんでした。もう一度認証してお試しください。");
        if (widget.current !== null) api.current?.reset(widget.current);
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
    }
  }

  return (
    <div className="join-verification">
      <p id={`${id}-privacy`} className="join-verification-note">
        botによる参加を減らすため、Google reCAPTCHAで操作を確認します。
        認証を開始するとGoogleへ接続します。
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
        >
          プライバシーポリシー
        </a>
        と
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noreferrer"
        >
          利用規約
        </a>
        をご確認ください。
      </p>
      {configured &&
        (phase === "idle" || phase === "loading" || phase === "failed") && (
          <button
            type="button"
            className="glass-button glass-button-secondary"
            onClick={start}
            disabled={phase === "loading"}
            aria-describedby={`${id}-privacy`}
          >
            {phase === "failed"
              ? "認証を再試行する"
              : phase === "loading"
                ? "認証を読み込み中"
                : "認証を開始する"}
          </button>
        )}
      <div ref={container} className="join-verification-widget" />
      <p
        id={`${id}-status`}
        className="join-verification-status"
        role="status"
        aria-live="polite"
      >
        {configured
          ? message
          : "参加認証は準備中です。しばらくしてからお試しください。"}
      </p>
      <button
        type="button"
        className="glass-button glass-button-primary"
        onClick={submit}
        disabled={!configured || !token || phase !== "challenge"}
        aria-describedby={`${id}-status`}
      >
        Discordで参加申請 <span aria-hidden="true">↗</span>
      </button>
      <noscript>
        <p>参加認証にはJavaScriptを有効にしてください。</p>
      </noscript>
    </div>
  );
}
