const idPattern = /^\d{8}-\d{6}(?:-\d{2,})?$/;
const sourcePattern = /^\/gallery\/gallery-\d{8}-\d{6}(?:-\d{2,})?\.webp$/;
const outputFilenamePattern = /^gallery-\d{8}-\d{6}(?:-\d{2,})?\.webp$/;
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export function isSupportedGalleryFilename(filename) {
  return supportedExtensions.has(
    filename.slice(filename.lastIndexOf(".")).toLowerCase(),
  );
}

export function isSafeGallerySource(id, src) {
  return (
    typeof id === "string" &&
    idPattern.test(id) &&
    typeof src === "string" &&
    sourcePattern.test(src) &&
    src === `/gallery/gallery-${id}.webp`
  );
}

export function createGalleryId(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

export function createUniqueGalleryId(baseId, entries, publicFiles) {
  const usedIds = new Set(entries.map((entry) => entry?.id));
  const usedFiles = new Set(publicFiles);
  let candidate = baseId;
  let suffix = 0;

  while (usedIds.has(candidate) || usedFiles.has(`gallery-${candidate}.webp`)) {
    suffix += 1;
    candidate = `${baseId}-${String(suffix).padStart(2, "0")}`;
  }

  return candidate;
}

export function prependGalleryEntry(entries, entry) {
  return [entry, ...entries];
}

export function formatGalleryManifest(entries) {
  return `${JSON.stringify(entries, null, 2)}\n`;
}

export function validateGalleryManifest(
  entries,
  { imageInfoBySrc = new Map(), publicFiles = [], checkImages = true } = {},
) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const sources = new Set();
  const referencedFiles = new Set();

  if (!Array.isArray(entries)) {
    return { errors: ["gallery.json は配列である必要があります。"], warnings };
  }

  for (const [index, entry] of entries.entries()) {
    const label = `Gallery entry ${index + 1}`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`${label}: オブジェクトではありません。`);
      continue;
    }

    const allowedKeys = new Set(["id", "src", "alt", "width", "height"]);
    for (const key of Object.keys(entry)) {
      if (!allowedKeys.has(key))
        errors.push(`${label}: 未対応の項目 ${key} があります。`);
    }

    if (typeof entry.id !== "string" || !idPattern.test(entry.id)) {
      errors.push(`${label}: id の形式が正しくありません。`);
    } else if (ids.has(entry.id)) {
      errors.push(`${label}: id が重複しています (${entry.id})。`);
    } else {
      ids.add(entry.id);
    }

    if (typeof entry.src === "string" && entry.src.trim() !== "") {
      if (sources.has(entry.src)) {
        errors.push(`${label}: src が重複しています (${entry.src})。`);
      } else {
        sources.add(entry.src);
      }
    }

    if (
      typeof entry.src !== "string" ||
      !isSafeGallerySource(entry.id, entry.src)
    ) {
      errors.push(
        `${label}: src は対応する /gallery/gallery-<id>.webp を指定してください。`,
      );
    } else {
      referencedFiles.add(entry.src.slice("/gallery/".length));
    }

    if (typeof entry.alt !== "string" || entry.alt.trim() === "") {
      errors.push(`${label}: alt が空です。`);
    }
    const validDimensions =
      Number.isInteger(entry.width) &&
      entry.width > 0 &&
      Number.isInteger(entry.height) &&
      entry.height > 0;
    if (!validDimensions) {
      errors.push(`${label}: width / height は正の整数である必要があります。`);
    }

    if (
      !checkImages ||
      typeof entry.src !== "string" ||
      !sourcePattern.test(entry.src)
    )
      continue;
    const imageInfo = imageInfoBySrc.get(entry.src);
    if (!imageInfo) {
      errors.push(
        `${label}: 画像ファイルが見つからないか、読み込めません (${entry.src})。`,
      );
      continue;
    }
    if (imageInfo.error) {
      errors.push(`${label}: 画像をデコードできません (${entry.src})。`);
      continue;
    }
    if (imageInfo.format !== "webp") {
      errors.push(
        `${label}: 公開画像は WebP である必要があります (${entry.src})。`,
      );
    }
    if (
      !Number.isInteger(imageInfo.width) ||
      !Number.isInteger(imageInfo.height) ||
      imageInfo.width <= 0 ||
      imageInfo.height <= 0
    ) {
      errors.push(`${label}: 画像サイズが正しくありません (${entry.src})。`);
    } else if (Math.max(imageInfo.width, imageInfo.height) > 1920) {
      errors.push(
        `${label}: 画像の長辺が1920pxを超えています (${entry.src})。`,
      );
    }
    if (
      validDimensions &&
      Number.isInteger(imageInfo.width) &&
      Number.isInteger(imageInfo.height) &&
      (entry.width !== imageInfo.width || entry.height !== imageInfo.height)
    ) {
      errors.push(
        `${label}: manifestのwidth / heightが画像と一致しません (${entry.src})。`,
      );
    }
    if (imageInfo.exif || imageInfo.iptc || imageInfo.xmp) {
      errors.push(
        `${label}: 個人情報を含む可能性がある画像メタデータが残っています (${entry.src})。`,
      );
    }
    if (imageInfo.size > 800 * 1024) {
      warnings.push(`${entry.src}: 画像は 800 KiB を超えています。`);
    }
  }

  for (const filename of publicFiles) {
    if (filename === ".gitkeep") continue;
    if (!outputFilenamePattern.test(filename)) {
      errors.push(
        `public/gallery にGallery用WebPではないファイルがあります (${filename})。`,
      );
    } else if (!referencedFiles.has(filename)) {
      warnings.push(
        `manifestから参照されていない画像があります (${filename})。`,
      );
    }
  }

  return { errors, warnings };
}

export function formatGallerySize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "不明";
  return `${Math.ceil(bytes / 1024)} KiB`;
}
