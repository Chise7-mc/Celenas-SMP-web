import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, link, open, readdir, rm, unlink } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";
import { createInterface } from "node:readline/promises";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";
import sharp from "sharp";
import {
  createGalleryId,
  createUniqueGalleryId,
  formatGallerySize,
  isSupportedGalleryFilename,
  prependGalleryEntry,
  validateGalleryManifest,
} from "./gallery-core.mjs";
import {
  ensureGalleryDirectories,
  galleryPaths,
  getImageInfo,
  getImageInfoFromBuffer,
  getPublicGalleryFiles,
  pathExists,
  readManifest,
  resolveContained,
  validateManifestOnDisk,
  writeManifestAtomic,
  writeRawManifestAtomic,
} from "./gallery-files.mjs";

const targetBytes = 800 * 1024;
const qualities = [84, 80, 76];

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function unlinkWithRetry(filePath) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await unlink(filePath);
      return;
    } catch (error) {
      if (error.code === "ENOENT") return;
      if (!["EBUSY", "EPERM"].includes(error.code) || attempt === 5)
        throw error;
      await delay(40 * (attempt + 1));
    }
  }
}

function displayError(error) {
  console.error(`ERROR:\n${error.message ?? "Galleryの追加に失敗しました。"}`);
  if (process.env.DEBUG_GALLERY === "1") console.error(error.stack);
}

async function getInboxImages() {
  const dirents = await readdir(galleryPaths.inbox, { withFileTypes: true });
  return dirents
    .filter((entry) => entry.isFile() && isSupportedGalleryFilename(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "ja"));
}

async function selectImage(images, readline) {
  if (images.length === 1) {
    console.log(`\nFound:\n${images[0]}`);
    return images[0];
  }

  console.log("\nGallery inbox:\n");
  images.forEach((filename, index) =>
    console.log(`[${index + 1}] ${filename}`),
  );
  while (true) {
    const answer = await readline.question("\n追加する画像番号: ");
    const selected = Number(answer.trim());
    if (
      Number.isInteger(selected) &&
      selected >= 1 &&
      selected <= images.length
    ) {
      return images[selected - 1];
    }
    console.log("一覧にある番号を入力してください。");
  }
}

async function askRequired(
  readline,
  prompt,
  requiredMessage = "この項目は必須です。入力してください。",
) {
  while (true) {
    const answer = (await readline.question(prompt)).trim();
    if (answer) return answer;
    console.log(requiredMessage);
  }
}

async function findArchivePath(filename) {
  const extension = extname(filename);
  const stem = basename(filename, extension);
  let candidate = resolveContained(galleryPaths.archive, filename);
  let suffix = 0;
  while (await pathExists(candidate)) {
    suffix += 1;
    candidate = resolveContained(
      galleryPaths.archive,
      `${stem}-${String(suffix).padStart(2, "0")}${extension}`,
    );
  }
  return candidate;
}

async function rejectArchivedDuplicate(sourcePath) {
  const candidateHash = await sha256File(sourcePath);
  const archiveEntries = await readdir(galleryPaths.archive, {
    withFileTypes: true,
  });
  for (const entry of archiveEntries) {
    if (!entry.isFile() || !isSupportedGalleryFilename(entry.name)) continue;
    const archivedPath = resolveContained(galleryPaths.archive, entry.name);
    const archivedHash = await sha256File(archivedPath);
    if (archivedHash === candidateHash) {
      throw new Error(
        "この画像はGalleryへ既に登録されている可能性があります。\n元画像は変更していません。",
      );
    }
  }
}

async function optimizeImage(sourcePath) {
  let data;
  for (const quality of qualities) {
    data = await sharp(sourcePath)
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 6 })
      .keepIccProfile()
      .toBuffer();
    if (data.length <= targetBytes || quality === qualities.at(-1)) {
      return { data, size: data.length, quality };
    }
  }
  throw new Error("画像をWebPへ変換できませんでした。");
}

async function writeNewImage(buffer, finalPath) {
  const temporaryPath = resolveContained(
    galleryPaths.public,
    `.gallery-${randomUUID()}.tmp`,
  );
  let handle;
  let published = false;
  try {
    handle = await open(temporaryPath, "wx");
    await handle.writeFile(buffer);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await link(temporaryPath, finalPath);
    published = true;
    await unlink(temporaryPath);
  } catch (error) {
    await handle?.close().catch(() => {});
    const cleanupErrors = [];
    for (const path of [temporaryPath, ...(published ? [finalPath] : [])]) {
      await unlinkWithRetry(path).catch((cleanupError) => {
        cleanupErrors.push(cleanupError);
      });
    }
    if (cleanupErrors.length > 0) {
      throw new Error(
        `${error.message}\n一時画像または公開画像を削除できませんでした: ${cleanupErrors.map(({ message }) => message).join("; ")}`,
      );
    }
    throw error;
  }
}

async function archiveOriginal(sourcePath, filename) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const archivePath = await findArchivePath(filename);
    try {
      await copyFile(sourcePath, archivePath, constants.COPYFILE_EXCL);
      try {
        await unlink(sourcePath);
      } catch (error) {
        await rm(archivePath, { force: true });
        throw error;
      }
      return archivePath;
    } catch (error) {
      if (error.code !== "EEXIST") {
        await rm(archivePath, { force: true }).catch(() => {});
        throw error;
      }
    }
  }
  throw new Error(
    "gallery-archive に同名ファイルが多く、元画像を移動できませんでした。",
  );
}

async function main() {
  await ensureGalleryDirectories();
  const images = await getInboxImages();
  if (images.length === 0) {
    console.log(
      "Gallery inbox に画像がありません。\n\n追加したい画像を:\ngallery-inbox/\n\nへ入れて、もう一度\n\npnpm gallery:add\n\nを実行してください。",
    );
    return;
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const filename = await selectImage(images, readline);
    const sourcePath = resolveContained(galleryPaths.inbox, filename);
    await rejectArchivedDuplicate(sourcePath);

    const alt = await askRequired(
      readline,
      "\n画像の説明 / alt: ",
      "画像の説明を入力してください。",
    );

    const { entries: currentEntries } = await readManifest();
    const existing = await validateManifestOnDisk(currentEntries);
    const structure = validateGalleryManifest(currentEntries, {
      checkImages: false,
    });
    const existingErrors = [...structure.errors, ...existing.errors];
    if (existingErrors.length > 0) {
      throw new Error(
        `gallery.json の検証に失敗しました。\n既存Galleryには変更を加えていません。\n${existingErrors.join("\n")}`,
      );
    }

    let inputMetadata;
    let inputDecoded;
    try {
      inputMetadata = await sharp(sourcePath).metadata();
      inputDecoded = await getImageInfo(sourcePath);
    } catch {
      throw new Error(
        "画像を読み込めませんでした。\n対応形式: PNG / JPG / JPEG / WebP",
      );
    }
    if (!["png", "jpeg", "webp"].includes(inputMetadata.format)) {
      throw new Error(
        "画像を読み込めませんでした。\n対応形式: PNG / JPG / JPEG / WebP",
      );
    }
    if (inputDecoded.width < 1 || inputDecoded.height < 1) {
      throw new Error(
        "画像を読み込めませんでした。\n対応形式: PNG / JPG / JPEG / WebP",
      );
    }

    const { files: publicFiles, errors: directoryErrors } =
      await getPublicGalleryFiles();
    if (directoryErrors.length > 0) throw new Error(directoryErrors.join("\n"));
    const baseId = createGalleryId();
    const id = createUniqueGalleryId(baseId, currentEntries, publicFiles);
    const outputFilename = `gallery-${id}.webp`;
    const source = `/gallery/${outputFilename}`;
    const finalPath = resolveContained(galleryPaths.public, outputFilename);

    console.log("\n--------------------------------\nGallery entry\n");
    console.log(`Source:\n${filename}\n\nAlt:\n${alt}`);
    const confirmation = (await readline.question("\n追加しますか? [Y/n]: "))
      .trim()
      .toLowerCase();
    if (confirmation && confirmation !== "y" && confirmation !== "yes") {
      console.log("変更せず終了しました。");
      return;
    }

    const optimized = await optimizeImage(sourcePath);
    const verifiedOutput = await getImageInfoFromBuffer(optimized.data);
    if (
      verifiedOutput.format !== "webp" ||
      verifiedOutput.width > 1920 ||
      verifiedOutput.height > 1920 ||
      verifiedOutput.exif ||
      verifiedOutput.iptc ||
      verifiedOutput.xmp
    ) {
      throw new Error(
        "生成したWebPの検証に失敗しました。元画像は変更していません。",
      );
    }

    console.log(
      `\nOutput\n${source}\n${verifiedOutput.width} × ${verifiedOutput.height}\n${formatGallerySize(optimized.size)} (quality ${optimized.quality})\n--------------------------------`,
    );
    const entry = {
      id,
      src: source,
      alt,
      width: verifiedOutput.width,
      height: verifiedOutput.height,
    };
    const updatedEntries = prependGalleryEntry(currentEntries, entry);
    const validation = validateGalleryManifest(updatedEntries, {
      imageInfoBySrc: new Map([
        ...existing.imageInfoBySrc,
        [source, verifiedOutput],
      ]),
      publicFiles: [...publicFiles, outputFilename],
    });
    if (validation.errors.length > 0) {
      throw new Error(
        `Gallery entry の検証に失敗しました。\n${validation.errors.join("\n")}`,
      );
    }

    const oldManifest = (await readManifest()).raw;
    let outputCreated = false;
    let manifestUpdateAttempted = false;
    try {
      await writeNewImage(optimized.data, finalPath);
      outputCreated = true;
      manifestUpdateAttempted = true;
      await writeManifestAtomic(updatedEntries);
      await archiveOriginal(sourcePath, filename);
    } catch (error) {
      let rollbackError;
      if (manifestUpdateAttempted) {
        try {
          await writeRawManifestAtomic(oldManifest);
        } catch (restoreError) {
          rollbackError = restoreError;
        }
      }
      if (outputCreated) {
        await unlinkWithRetry(finalPath).catch((cleanupError) => {
          rollbackError ??= cleanupError;
        });
      }
      if (rollbackError) {
        throw new Error(
          `登録処理に失敗し、manifestの復元にも失敗しました。\nGallery画像: ${source}\n詳細: ${rollbackError.message}`,
        );
      }
      throw new Error(
        `${error.message}\nmanifestと公開画像は元に戻しました。元画像はinboxに残しています。`,
      );
    }

    if (optimized.size > targetBytes) {
      console.warn(
        "WARNING:\n画像は 800 KiB を超えています。\n画質を優先して保存しました。",
      );
    }
    for (const warning of validation.warnings)
      console.warn(`WARNING: ${warning}`);
    console.log(
      "\n✓ WebP optimized\n✓ Gallery manifest updated\n✓ Original moved to gallery-archive\n\nGalleryへ追加しました。\n\nPreview:\npnpm dev",
    );
  } finally {
    readline.close();
  }
}

main().catch((error) => {
  displayError(error);
  process.exitCode = 1;
});
