import type { CommunityConnection } from "@/config/site";
import { CommunityDetails } from "@/components/community-details";

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
          <p>参加申請とMinecraftへの参加案内はDiscordから確認できます。</p>
          <a
            className="glass-button glass-button-primary"
            href={connection.discordUrl}
            target="_blank"
            rel="noreferrer"
          >
            Discordに参加する <span aria-hidden="true">↗</span>
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
