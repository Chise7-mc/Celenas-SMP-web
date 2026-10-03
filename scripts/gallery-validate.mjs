import {
  ensureGalleryDirectories,
  readManifest,
  validateManifestOnDisk,
} from "./gallery-files.mjs";

try {
  await ensureGalleryDirectories();
  const { entries } = await readManifest();
  const { errors, warnings } = await validateManifestOnDisk(entries);
  for (const warning of warnings) console.warn(`WARNING: ${warning}`);
  if (errors.length > 0) {
    console.error(
      `ERROR:\ngallery.json の検証に失敗しました。\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`Gallery manifest is valid (${entries.length} images).`);
  }
} catch (error) {
  console.error(`ERROR:\n${error.message}`);
  if (process.env.DEBUG_GALLERY === "1") console.error(error.stack);
  process.exitCode = 1;
}
