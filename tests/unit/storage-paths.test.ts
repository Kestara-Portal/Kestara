import { describe, expect, it } from "vitest";

import {
  AVATAR_BUCKET,
  PORTFOLIO_BUCKET,
  buildAvatarPath,
  buildPortfolioMediaPath,
} from "@/lib/storage/paths";

describe("storage paths", () => {
  it("uses the documented bucket names", () => {
    expect(AVATAR_BUCKET).toBe("profile-avatars");
    expect(PORTFOLIO_BUCKET).toBe("portfolio-files");
  });

  it("builds an avatar path scoped to the owner", () => {
    const path = buildAvatarPath("user-1", "file-1", ".PNG");
    expect(path).toBe("user-1/file-1.png");
    expect(path.split("/")[0]).toBe("user-1");
  });

  it("builds a portfolio path scoped to the owner", () => {
    const path = buildPortfolioMediaPath("user-1", "item-1", "file-1", "jpg");
    expect(path).toBe("user-1/item-1/file-1.jpg");
    expect(path.split("/")[0]).toBe("user-1");
  });

  it("sanitizes extensions", () => {
    expect(buildAvatarPath("u", "f", ".j p g")).toBe("u/f.jpg");
  });
});
