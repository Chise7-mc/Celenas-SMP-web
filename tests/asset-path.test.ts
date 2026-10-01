import { describe, expect, it } from "vitest";
import { withBasePath } from "@/lib/asset-path";

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

  it("rejects non-root-relative and protocol-relative paths", () => {
    expect(() => withBasePath("brand/logo.png", "")).toThrow(
      "Expected a root-relative public asset path",
    );
    expect(() => withBasePath("//example.com/logo.png", "")).toThrow(
      "Expected a root-relative public asset path",
    );
  });
});
