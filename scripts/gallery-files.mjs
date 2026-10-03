import { randomUUID } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  formatGalleryManifest,
  isSafeGallerySource,
  validateGalleryManifest,
} from "./gallery-core.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const galleryPaths = Object.freeze({
  root: projectRoot,
  inbox: resolve(projectRoot, "gallery-inbox"),
  archive: resolve(projectRoot, "gallery-archive"),
  public: resolve(projectRoot, "public", "gallery"),
  manifest: resolve(projectRoot, "src", "content", "gallery.json"),
});

export function resolveContained(directory, filename) {
  const root = resolve(directory);
  const target = resolve(root, filename);
  if (target === root || !target.startsWith(`${root}${sep}`)) {
    throw new Error("指定されたファイルパスが許可範囲外です。");
  }
  return target;
}

export async function ensureGalleryDirectories() {
  const root = await realpath(galleryPaths.root);
  for (const directory of [
    galleryPaths.inbox,
    galleryPaths.archive,
    galleryPaths.public,
  ]) {
    try {
      await lstat(directory);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(directory, { recursive: true });
    }
    const info = await lstat(directory);
    const actualPath = await realpath(directory);
    const expectedPath = resolve(
      root,
      directory.slice(galleryPaths.root.length + 1),
    );
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      actualPath !== expectedPath
    ) {
      throw new Error(
        `Galleryフォルダが安全なディレクトリではありません: ${directory}`,
      );
    }
  }
}

export async function readManifest() {
  let raw;
  try {
    const info = await lstat(galleryPaths.manifest);
    if (!info.isFile() || info.isSymbolicLink()) {
      throw new Error(
        "src/content/gallery.json が通常のファイルではありません。",
      );
    }
    raw = await readFile(galleryPaths.manifest, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("src/content/gallery.json が見つかりません。");
    }
    throw error;
  }

  try {
    return { entries: JSON.parse(raw), raw };
  } catch {
    throw new Error("gallery.json をJSONとして読み込めません。");
  }
}

export async function writeManifestAtomic(entries) {
  await writeRawManifestAtomic(formatGalleryManifest(entries));
}

export async function writeRawManifestAtomic(contents) {
  const temporaryPath = resolve(
    dirname(galleryPaths.manifest),
    `.gallery-${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, contents, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, galleryPaths.manifest);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function getPublicGalleryFiles() {
  const dirents = await readdir(galleryPaths.public, { withFileTypes: true });
  const errors = [];
  const files = [];
  for (const dirent of dirents) {
    if (dirent.name === ".gitkeep") continue;
    if (dirent.isSymbolicLink()) {
      errors.push(
        `public/gallery にシンボリックリンクがあります (${dirent.name})。`,
      );
    } else if (dirent.isFile()) {
      files.push(dirent.name);
    } else {
      errors.push(
        `public/gallery にファイル以外の項目があります (${dirent.name})。`,
      );
    }
  }
  return { files, errors };
}

export async function getImageInfo(filePath) {
  const [metadata, decoded, fileStat] = await Promise.all([
    sharp(filePath).metadata(),
    sharp(filePath).rotate().toBuffer({ resolveWithObject: true }),
    lstat(filePath),
  ]);
  return {
    format: metadata.format,
    width: decoded.info.width,
    height: decoded.info.height,
    size: fileStat.size,
    exif: metadata.exif,
    iptc: metadata.iptc,
    xmp: metadata.xmp,
  };
}

export async function getImageInfoFromBuffer(buffer) {
  const [metadata, decoded] = await Promise.all([
    sharp(buffer).metadata(),
    sharp(buffer).rotate().toBuffer({ resolveWithObject: true }),
  ]);
  return {
    format: metadata.format,
    width: decoded.info.width,
    height: decoded.info.height,
    size: buffer.length,
    exif: metadata.exif,
    iptc: metadata.iptc,
    xmp: metadata.xmp,
  };
}

export async function validateManifestOnDisk(entries) {
  const { files, errors: directoryErrors } = await getPublicGalleryFiles();
  const imageInfoBySrc = new Map();

  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (!entry || !isSafeGallerySource(entry.id, entry.src)) continue;
      const filename = entry.src.slice("/gallery/".length);
      if (!files.includes(filename)) continue;
      const filePath = resolveContained(galleryPaths.public, filename);
      try {
        imageInfoBySrc.set(entry.src, await getImageInfo(filePath));
      } catch (error) {
        imageInfoBySrc.set(entry.src, { error });
      }
    }
  }

  const validation = validateGalleryManifest(entries, {
    imageInfoBySrc,
    publicFiles: files,
  });
  return {
    errors: [...directoryErrors, ...validation.errors],
    warnings: validation.warnings,
    files,
    imageInfoBySrc,
  };
}

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
