export function withBasePath(
  path: string,
  basePath = process.env.GITHUB_PAGES === "true"
    ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
    : "",
): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(
      `Expected a root-relative public asset path, received: ${path}`,
    );
  }

  return `${basePath}${path}`;
}
