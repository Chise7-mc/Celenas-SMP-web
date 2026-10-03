export type GalleryEntry = Readonly<{
  id: string;
  src: string;
  alt: string;
  caption: string;
  location?: string;
}>;

export type GalleryImageInfo = Readonly<{
  format?: string;
  width?: number;
  height?: number;
  size?: number;
  exif?: Uint8Array;
  iptc?: Uint8Array;
  xmp?: string | Uint8Array;
  error?: unknown;
}>;

export type GalleryValidationResult = Readonly<{
  errors: string[];
  warnings: string[];
}>;

export function isSupportedGalleryFilename(filename: string): boolean;
export function isSafeGallerySource(id: unknown, src: unknown): boolean;
export function createGalleryId(date?: Date): string;
export function createUniqueGalleryId(
  baseId: string,
  entries: readonly Partial<GalleryEntry>[],
  publicFiles: readonly string[],
): string;
export function prependGalleryEntry<T>(entries: readonly T[], entry: T): T[];
export function formatGalleryManifest(entries: readonly unknown[]): string;
export function validateGalleryManifest(
  entries: unknown,
  options?: Readonly<{
    imageInfoBySrc?: ReadonlyMap<string, GalleryImageInfo>;
    publicFiles?: readonly string[];
    checkImages?: boolean;
  }>,
): GalleryValidationResult;
export function formatGallerySize(bytes: number): string;
