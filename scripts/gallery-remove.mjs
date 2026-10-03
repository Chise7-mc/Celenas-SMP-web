import { randomUUID } from "node:crypto";
import { lstat, rename, unlink } from "node:fs/promises";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { validateGalleryManifest } from "./gallery-core.mjs";
import {
  ensureGalleryDirectories,
  galleryPaths,
  pathExists,
  readManifest,
  resolveContained,
  writeManifestAtomic,
  writeRawManifestAtomic,
} from "./gallery-files.mjs";

try {
  await ensureGalleryDirectories();
  const { entries, raw: originalManifest } = await readManifest();
  const structure = validateGalleryManifest(entries, { checkImages: false });
  if (structure.errors.length > 0) {
    throw new Error(
      `gallery.json の検証に失敗しました。\n${structure.errors.join("\n")}`,
    );
  }
  if (entries.length === 0) {
    console.log("Celenas Gallery — 0 images\n削除できる画像はありません。");
  } else {
    console.log("Celenas Gallery\n");
    entries.forEach((entry, index) =>
      console.log(`[${index + 1}] gallery-${entry.id}.webp`),
    );
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      const answer = await readline.question("\n削除する番号: ");
      const selected = Number(answer.trim());
      if (
        !Number.isInteger(selected) ||
        selected < 1 ||
        selected > entries.length
      ) {
        throw new Error("一覧にある番号を入力してください。");
      }

      const entry = entries[selected - 1];
      const filename = entry.src.slice("/gallery/".length);
      const imagePath = resolveContained(galleryPaths.public, filename);
      let imageExists = await pathExists(imagePath);
      if (imageExists) {
        const info = await lstat(imagePath);
        if (!info.isFile() || info.isSymbolicLink()) {
          throw new Error(
            "削除対象が通常の画像ファイルではありません。変更していません。",
          );
        }
      }

      const prompt = imageExists
        ? `${filename} をGalleryから削除しますか? [y/N]: `
        : `画像ファイル ${entry.src} が見つかりません。manifestから${filename}を削除しますか? [y/N]: `;
      const confirmation = (await readline.question(prompt))
        .trim()
        .toLowerCase();
      if (confirmation !== "y" && confirmation !== "yes") {
        console.log("変更せず終了しました。");
      } else {
        const tombstonePath = resolveContained(
          galleryPaths.public,
          `.gallery-remove-${randomUUID()}.tmp`,
        );
        if (imageExists) await rename(imagePath, tombstonePath);
        try {
          await writeManifestAtomic(
            entries.filter((_, index) => index !== selected - 1),
          );
          if (imageExists) await unlink(tombstonePath);
        } catch (error) {
          let rollbackError;
          if (imageExists && (await pathExists(tombstonePath))) {
            await rename(tombstonePath, imagePath).catch((restoreError) => {
              rollbackError = restoreError;
            });
          }
          await writeRawManifestAtomic(originalManifest).catch(
            (restoreError) => {
              rollbackError ??= restoreError;
            },
          );
          throw new Error(
            rollbackError
              ? `${error.message}\nGalleryの復元も完了できませんでした: ${rollbackError.message}`
              : `${error.message}\nGallery manifestと画像を元に戻しました。`,
          );
        }
        console.log(
          `✓ Galleryから${filename}を削除しました。\n元画像archiveは変更していません。`,
        );
      }
    } finally {
      readline.close();
    }
  }
} catch (error) {
  console.error(`ERROR:\n${error.message}`);
  if (process.env.DEBUG_GALLERY === "1") console.error(error.stack);
  process.exitCode = 1;
}
