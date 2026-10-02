import type { CommunityConnection } from "@/config/site";
import { CommunityDetails } from "@/components/community-details";

export type TransmissionState = "PENDING" | "PARTIAL" | "READY";

export function getTransmissionState(
  connection: CommunityConnection,
): TransmissionState {
  const configured = [
    connection.serverAddress,
    connection.minecraftVersion,
    connection.discordUrl,
  ].filter(Boolean).length;

  if (configured === 3) return "READY";
  return configured === 0 ? "PENDING" : "PARTIAL";
}

export function TransmissionPanel({
  connection,
  variant,
}: {
  connection: CommunityConnection;
  variant: "community" | "join";
}) {
  const state = getTransmissionState(connection);
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
          {isJoin ? "JOIN / ACCESS" : "TRANSMISSION / CONNECTION"}
        </p>
        <span className="transmission-state">
          <span className="transmission-light" aria-hidden="true" />
          {state}
        </span>
      </div>

      {isJoin ? (
        <div className="transmission-access">
          <p>
            {connection.discordUrl
              ? "参加案内をDiscordで確認できます。"
              : "Minecraftの接続情報とDiscordの案内は、確認できたものから公開します。"}
          </p>
          {connection.discordUrl ? (
            <a
              className="glass-button glass-button-primary"
              href={connection.discordUrl}
              target="_blank"
              rel="noreferrer"
            >
              Discordに参加する <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="transmission-pending">
              PUBLIC ACCESS / PENDING
            </span>
          )}
        </div>
      ) : (
        <>
          <CommunityDetails connection={connection} />
          <p className="transmission-footnote">
            {state === "PENDING"
              ? "PUBLIC LINK / PENDING · 公開情報を準備中"
              : `PUBLIC LINK / ${state}`}
          </p>
        </>
      )}
    </div>
  );
}
