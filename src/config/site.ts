export type CommunityConnection = Readonly<{
  minecraftVersion: string;
  discordUrl: `https://${string}`;
}>;

export const site = {
  name: "Celenas SMP",
  description:
    "Celenas SMP — Minecraft Java Edition 26.3で、建築・探索・ものづくりをそれぞれのペースで楽しむサバイバルコミュニティ。",
  connection: {
    minecraftVersion: "26.3",
    discordUrl: "https://discord.gg/cuXPVNccYv",
  } satisfies CommunityConnection,
} as const;
