import { describe, expect, it } from "vitest";
import { homeContent } from "@/content/home";

describe("home editorial copy", () => {
  it("keeps the Gallery empty state plain and specific", () => {
    expect(homeContent.gallery.pending).toBe("まだ画像はありません。");
    expect(homeContent.gallery.emptyDescription).toBe(
      "ワールドのスクリーンショットをここに追加していきます。",
    );
  });
});
