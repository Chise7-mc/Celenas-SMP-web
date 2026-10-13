"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: "discord_join";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "dark";
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const scriptId = "cloudflare-turnstile-api";

export function TurnstileJoin({
  siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
}: {
  siteKey?: string;
} = {}) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Discord参加には認証が必要です。");
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const widgetHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const activeRef = useRef(false);
  const busyRef = useRef(false);

  const resetChallenge = useCallback((message: string) => {
    busyRef.current = false;
    setBusy(false);
    setInviteUrl(null);
    setStatus(message);
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, []);

  const verify = useCallback(
    async (token: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setStatus("認証を確認しています…");
      try {
        const response = await fetch("/api/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        const result: unknown = await response.json();
        if (
          !response.ok ||
          !result ||
          typeof result !== "object" ||
          typeof (result as { inviteUrl?: unknown }).inviteUrl !== "string"
        )
          throw new Error("verification failed");
        const url = new URL((result as { inviteUrl: string }).inviteUrl);
        if (url.protocol !== "https:" || url.hostname !== "discord.gg") {
          throw new Error("invalid invite");
        }
        setInviteUrl(url.toString());
        setStatus("認証しました。Discordへの参加リンクを開けます。");
        busyRef.current = false;
        setBusy(false);
      } catch {
        resetChallenge("確認に失敗しました。もう一度認証してください。");
      }
    },
    [resetChallenge],
  );

  useEffect(() => {
    activeRef.current = active;
    if (!active || !siteKey || !widgetHost.current) return;

    const renderWidget = () => {
      if (
        !activeRef.current ||
        !window.turnstile ||
        !widgetHost.current ||
        widgetId.current
      )
        return;
      widgetId.current = window.turnstile.render(widgetHost.current, {
        sitekey: siteKey,
        action: "discord_join",
        theme: "dark",
        callback: (token) => void verify(token),
        "expired-callback": () =>
          resetChallenge("認証の有効期限が切れました。再認証してください。"),
        "error-callback": () =>
          resetChallenge(
            "認証の読み込みに失敗しました。通信を確認して再試行してください。",
          ),
      });
      setStatus("Cloudflare Turnstileで認証してください。");
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    const isNewScript = !script;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
    }
    const onLoad = () => renderWidget();
    const onError = () => {
      document.getElementById(scriptId)?.remove();
      setStatus("認証を読み込めません。通信を確認して再試行してください。");
    };
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    if (isNewScript) document.head.append(script);

    return () => {
      activeRef.current = false;
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [active, resetChallenge, siteKey, verify]);

  return (
    <div className="turnstile-join">
      {!active && (
        <button
          className="glass-button glass-button-primary"
          type="button"
          onClick={() => {
            setActive(true);
            setStatus(
              siteKey
                ? "認証を準備しています…"
                : "現在、参加認証を準備中です。時間をおいて再度ご確認ください。",
            );
          }}
        >
          Discord参加の認証を開始
        </button>
      )}
      {active && siteKey && (
        <div ref={widgetHost} className="turnstile-widget" />
      )}
      {active && siteKey && status.includes("読み込め") && (
        <button
          className="glass-button glass-button-secondary"
          type="button"
          onClick={() => {
            setActive(false);
            window.setTimeout(() => setActive(true), 0);
          }}
        >
          認証を再読み込み
        </button>
      )}
      <p className="turnstile-status" role="status" aria-live="polite">
        {status}
      </p>
      {inviteUrl && (
        <a
          className="glass-button glass-button-primary"
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
        >
          Discordで参加申請 <span aria-hidden="true">↗</span>
        </a>
      )}
      {busy && <span className="sr-only">認証中は操作できません。</span>}
    </div>
  );
}
