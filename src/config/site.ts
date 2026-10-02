export type CommunityConnection = Readonly<{
  serverAddress: string | null;
  minecraftVersion: string | null;
  discordUrl: `https://${string}` | null;
}>;

export const site = {
  name: "Celenas SMP",
  description:
    "Celenas SMP — Minecraftサバイバルを、それぞれのペースで楽しむコミュニティ。",
  connection: {
    serverAddress: null,
    minecraftVersion: null,
    discordUrl: null,
  } satisfies CommunityConnection,
} as const;
