import { describe, expect, it } from "vitest";
import { getAssetBasePath, withBasePath } from "@/lib/asset-path";

describe("withBasePath", () => {
  it("keeps root-relative asset paths unchanged without a base path", () => {
    expect(withBasePath("/brand/celenas-logo-white.png", "")).toBe(
      "/brand/celenas-logo-white.png",
    );
  });

  it("prefixes local public assets with the Pages project path", () => {
    expect(withBasePath("/world/spawn.png", "/Celenas-SMP")).toBe(
      "/Celenas-SMP/world/spawn.png",
    );
  });

  it("keeps Cloudflare assets at the domain root", () => {
    expect(getAssetBasePath({ NEXT_PUBLIC_BASE_PATH: undefined })).toBe("");
  });

  it("reads the public Pages prefix for browser-safe asset URLs", () => {
    expect(
      getAssetBasePath({ NEXT_PUBLIC_BASE_PATH: "/Celenas-SMP-web" }),
    ).toBe("/Celenas-SMP-web");
  });

  it("rejects non-root-relative and protocol-relative paths", () => {
    expect(() => withBasePath("brand/logo.png", "")).toThrow(
      "Expected a root-relative public asset path",
    );
    expect(() => withBasePath("//example.com/logo.png", "")).toThrow(
      "Expected a root-relative public asset path",
    );
  });
});
