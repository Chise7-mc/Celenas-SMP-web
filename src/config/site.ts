export type CommunityConnection = Readonly<{
  minecraftVersion: string;
  discordUrl: `https://${string}`;
}>;

export const site = {
  name: "Celenas SMP",
  description:
    "Minecraft Java Edition 26.3で建築・探索・装置づくりを楽しめるサバイバルサーバー。参加申請と接続方法はDiscordで案内しています。",
  connection: {
    minecraftVersion: "26.3",
    discordUrl: "https://discord.gg/cuXPVNccYv",
  } satisfies CommunityConnection,
} as const;
