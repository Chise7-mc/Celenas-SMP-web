// Used at both boundaries; the invitation itself only lives in server settings.
export function parseDiscordInvite(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    )
      return null;
    const validPath =
      url.hostname === "discord.gg"
        ? /^\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)
        : url.hostname === "discord.com" &&
          /^\/invite\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname);
    return validPath ? url.href : null;
  } catch {
    return null;
  }
}
export function navigateToDiscord(url: string) {
  window.location.assign(url);
}
