import type { CommunityConnection } from "@/config/site";

export function CommunityDetails({
  connection,
}: {
  connection: CommunityConnection;
}) {
  return (
    <dl className="community-details">
      <div>
        <dt>エディション</dt>
        <dd>Minecraft Java Edition</dd>
      </div>
      <div>
        <dt>バージョン</dt>
        <dd>{connection.minecraftVersion}</dd>
      </div>
      <div>
        <dt>参加窓口</dt>
        <dd>
          <span>参加申請後の案内はDiscordで確認できます。</span>
        </dd>
      </div>
    </dl>
  );
}
