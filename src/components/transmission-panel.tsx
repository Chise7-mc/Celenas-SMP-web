import Image from "next/image";
import type { CommunityConnection } from "@/config/site";
import { CommunityDetails } from "@/components/community-details";
import { withBasePath } from "@/lib/asset-path";

export function TransmissionPanel({
  connection,
  variant,
}: {
  connection: CommunityConnection;
  variant: "community" | "join";
}) {
  const state = "READY";
  const isJoin = variant === "join";

  return (
    <div
      className={`transmission-panel transmission-panel-${variant}`}
      data-state={state.toLowerCase()}
    >
      <span
        className="transmission-corner transmission-corner-top"
        aria-hidden="true"
      />
      <span
        className="transmission-corner transmission-corner-bottom"
        aria-hidden="true"
      />
      <div className="transmission-heading">
        <p className="transmission-label">
          {isJoin ? "JOIN / ACCESS" : "TRANSMISSION / SERVER"}
        </p>
        <span className="transmission-state">
          <span className="transmission-light" aria-hidden="true" />
          {state}
        </span>
      </div>

      {isJoin ? (
        <div className="transmission-access">
          <div className="transmission-discord">
            <Image
              className="discord-mark"
              src={withBasePath("/brand/discord-mark.png")}
              alt=""
              width={320}
              height={320}
            />
            <p>参加申請と接続方法はDiscordで案内しています。</p>
          </div>
          <a
            className="glass-button glass-button-primary"
            href={connection.discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            Discordで参加申請 <span aria-hidden="true">↗</span>
          </a>
        </div>
      ) : (
        <>
          <CommunityDetails connection={connection} />
          <p className="transmission-footnote">PUBLIC INFO / {state}</p>
        </>
      )}
    </div>
  );
}
