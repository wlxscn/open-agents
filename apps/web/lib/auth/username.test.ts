import { describe, expect, test } from "bun:test";
import { resolveOAuthUsername } from "./username";

describe("resolveOAuthUsername", () => {
  test("prefers the provider username when available", () => {
    expect(
      resolveOAuthUsername(
        { username: "Vercel User", name: "Fallback", email: "a@b.com" },
        "seed",
      ),
    ).toBe("vercel-user");
  });

  test("falls back to name then email prefix", () => {
    expect(
      resolveOAuthUsername(
        { name: "Nico Albanese", email: "nico@example.com" },
        "seed",
      ),
    ).toBe("nico-albanese");
    expect(resolveOAuthUsername({ email: "nico@example.com" }, "seed")).toBe(
      "nico",
    );
  });

  test("uses a generated fallback when no usable identity fields exist", () => {
    expect(resolveOAuthUsername({}, "generated-seed")).toBe("user-generate");
  });
});
