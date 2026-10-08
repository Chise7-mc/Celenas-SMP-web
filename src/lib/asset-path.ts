type AssetPathEnvironment = Readonly<Record<string, string | undefined>>;

export function getAssetBasePath(
  environment: AssetPathEnvironment = process.env,
): string {
  return environment.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function withBasePath(
  path: string,
  basePath = getAssetBasePath(process.env),
): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(
      `Expected a root-relative public asset path, received: ${path}`,
    );
  }

  return `${basePath}${path}`;
}
