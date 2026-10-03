import { describe, expect, it } from "vitest";
import {
  createGalleryId,
  createUniqueGalleryId,
  formatGalleryManifest,
  isSafeGallerySource,
  isSupportedGalleryFilename,
  prependGalleryEntry,
  validateGalleryManifest,
} from "../scripts/gallery-core.mjs";
import type {
  GalleryEntry,
  GalleryImageInfo,
} from "../scripts/gallery-core.mjs";

const validEntry: GalleryEntry = {
  id: "20261003-130741",
  src: "/gallery/gallery-20261003-130741.webp",
  alt: "軌道上に建つ巨大な建築物",
  caption: "軌道建築",
  location: "Celenas SMP",
};

const validInfo: GalleryImageInfo = {
  format: "webp",
  width: 1920,
  height: 1009,
  size: 300_000,
};

function validate(entries: readonly unknown[], info = validInfo) {
  const imageInfoBySrc = new Map<string, GalleryImageInfo>();
  for (const entry of entries) {
    if (entry && typeof entry === "object" && "src" in entry) {
      imageInfoBySrc.set(String(entry.src), info);
    }
  }
  const publicFiles = [...imageInfoBySrc.keys()].map((src) =>
    src.slice("/gallery/".length),
  );
  return validateGalleryManifest(entries, { imageInfoBySrc, publicFiles });
}

describe("Gallery manifest helpers", () => {
  it("accepts a valid WebP entry and its decoded image", () => {
    expect(validate([validEntry]).errors).toEqual([]);
  });

  it("allows location to be omitted", () => {
    const withoutLocation = {
      id: validEntry.id,
      src: validEntry.src,
      alt: validEntry.alt,
      caption: validEntry.caption,
    };
    expect(validate([withoutLocation]).errors).toEqual([]);
  });

  it("rejects duplicate IDs", () => {
    const result = validate([validEntry, validEntry]);
    expect(result.errors.some((error) => error.includes("id が重複"))).toBe(
      true,
    );
  });

  it("rejects duplicate sources", () => {
    const otherId = { ...validEntry, id: "20261003-130742" };
    const result = validate([validEntry, { ...otherId, src: validEntry.src }]);
    expect(result.errors.some((error) => error.includes("src が重複"))).toBe(
      true,
    );
  });

  it("rejects missing captions and alt text", () => {
    expect(
      validate([{ ...validEntry, caption: " " }]).errors.join("\n"),
    ).toContain("caption が空");
    expect(validate([{ ...validEntry, alt: "" }]).errors.join("\n")).toContain(
      "alt が空",
    );
  });

  it("rejects an entry whose public image is missing", () => {
    const result = validateGalleryManifest([validEntry]);
    expect(result.errors.join("\n")).toContain("画像ファイルが見つからない");
  });

  it("rejects original files and temporary output in the public folder", () => {
    const imageInfoBySrc = new Map([[validEntry.src, validInfo]]);
    const result = validateGalleryManifest([validEntry], {
      imageInfoBySrc,
      publicFiles: [
        "gallery-20261003-130741.webp",
        "source.PNG",
        ".gallery-temp.tmp.webp",
      ],
    });
    expect(
      result.errors.filter((error) => error.includes("ではないファイル")),
    ).toHaveLength(2);
  });

  it("rejects invalid dimensions, oversized images, and identifying metadata", () => {
    expect(
      validate([validEntry], { ...validInfo, width: 0 }).errors.join("\n"),
    ).toContain("画像サイズ");
    expect(
      validate([validEntry], { ...validInfo, width: 1921 }).errors.join("\n"),
    ).toContain("1920px");
    expect(
      validate([validEntry], {
        ...validInfo,
        exif: new Uint8Array([1]),
      }).errors.join("\n"),
    ).toContain("メタデータ");
  });

  it("allows large images with a size warning", () => {
    const result = validate([validEntry], { ...validInfo, size: 900 * 1024 });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain(
      `${validEntry.src}: 画像は 800 KiB を超えています。`,
    );
  });

  it("blocks traversal and accepts only supported extensions regardless of case", () => {
    expect(
      isSafeGallerySource(validEntry.id, "/gallery/../../private.webp"),
    ).toBe(false);
    expect(isSupportedGalleryFilename("Screenshot.PNG")).toBe(true);
    expect(isSupportedGalleryFilename("Screenshot.jpeg")).toBe(true);
    expect(isSupportedGalleryFilename("notes.txt")).toBe(false);
  });

  it("generates stable IDs, avoids collisions, and prepends new entries", () => {
    expect(createGalleryId(new Date("2026-10-03T13:07:41.000Z"))).toBe(
      "20261003-130741",
    );
    expect(
      createUniqueGalleryId(
        validEntry.id,
        [validEntry],
        ["gallery-20261003-130741-01.webp"],
      ),
    ).toBe("20261003-130741-02");
    expect(
      prependGalleryEntry([validEntry], { ...validEntry, id: "new" })[0]?.id,
    ).toBe("new");
    expect(formatGalleryManifest([validEntry])).toBe(
      `${JSON.stringify([validEntry], null, 2)}\n`,
    );
  });
});
