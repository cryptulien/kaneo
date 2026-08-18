import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASKER_EMAIL,
  isTaskEnvironment,
  isValidAskerEmail,
  normalizeAskerEmail,
} from "./environment";

describe("task environment and asker", () => {
  it("accepts only dev, preprod and prod", () => {
    expect(isTaskEnvironment("dev")).toBe(true);
    expect(isTaskEnvironment("preprod")).toBe(true);
    expect(isTaskEnvironment("prod")).toBe(true);
    expect(isTaskEnvironment("staging")).toBe(false);
  });

  it("falls back to Julien when the asker is empty", () => {
    expect(normalizeAskerEmail(null)).toBe(DEFAULT_ASKER_EMAIL);
    expect(normalizeAskerEmail("  ")).toBe(DEFAULT_ASKER_EMAIL);
    expect(normalizeAskerEmail("Ada@Example.com")).toBe("ada@example.com");
  });

  it("rejects malformed emails", () => {
    expect(isValidAskerEmail(DEFAULT_ASKER_EMAIL)).toBe(true);
    expect(isValidAskerEmail("not-an-email")).toBe(false);
  });
});
