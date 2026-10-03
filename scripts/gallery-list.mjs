import { formatGallerySize, validateGalleryManifest } from "./gallery-core.mjs";
import {
  ensureGalleryDirectories,
  galleryPaths,
  pathExists,
  readManifest,
  resolveContained,
} from "./gallery-files.mjs";
import { stat } from "node:fs/promises";

try {
  await ensureGalleryDirectories();
  const { entries } = await readManifest();
  const validation = validateGalleryManifest(entries, { checkImages: false });
  if (validation.errors.length > 0) {
    console.error(
      `ERROR:\ngallery.json の検証に失敗しました。\n${validation.errors.join("\n")}`,
    );
    process.exitCode = 1;
  } else if (entries.length === 0) {
    console.log("Celenas Gallery — 0 images");
  } else {
    console.log(`Celenas Gallery — ${entries.length} images\n`);
    for (const [index, entry] of entries.entries()) {
      const filename = entry.src.slice("/gallery/".length);
      const imagePath = resolveContained(galleryPaths.public, filename);
      const size = (await pathExists(imagePath))
        ? formatGallerySize((await stat(imagePath)).size)
        : "MISSING";
      console.log(`${String(index + 1).padStart(2, "0")}  ${entry.id}`);
      console.log(`    ${entry.caption}`);
      if (entry.location) console.log(`    ${entry.location}`);
      console.log(`    ${entry.src}`);
      console.log(`    ${size}\n`);
    }
  }
} catch (error) {
  console.error(`ERROR:\n${error.message}`);
  if (process.env.DEBUG_GALLERY === "1") console.error(error.stack);
  process.exitCode = 1;
}
