export type CommunityConnection = Readonly<{
  serverAddress: string | null;
  minecraftVersion: string | null;
  discordUrl: `https://${string}` | null;
}>;

export const site = {
  name: "Celenas SMP",
  description: "Celenas SMP — Minecraft コミュニティの案内サイト。",
  connection: {
    serverAddress: null,
    minecraftVersion: null,
    discordUrl: null,
  } satisfies CommunityConnection,
} as const;
