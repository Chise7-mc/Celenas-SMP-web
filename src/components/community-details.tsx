import type { CommunityConnection } from "@/config/site";

export function CommunityDetails({
  connection,
}: {
  connection: CommunityConnection;
}) {
  return (
    <dl className="community-details">
      <div>
        <dt>サーバーアドレス</dt>
        <dd>
          {connection.serverAddress ? (
            <code>{connection.serverAddress}</code>
          ) : (
            "サーバーアドレスは準備中です。"
          )}
        </dd>
      </div>
      <div>
        <dt>Minecraft バージョン</dt>
        <dd>{connection.minecraftVersion || "対応バージョンは準備中です。"}</dd>
      </div>
      <div>
        <dt>コミュニティ</dt>
        <dd>
          {connection.discordUrl ? (
            <a href={connection.discordUrl} target="_blank" rel="noreferrer">
              Discord コミュニティへ参加 ↗
            </a>
          ) : (
            "Discord の案内は準備中です。"
          )}
        </dd>
      </div>
    </dl>
  );
}
