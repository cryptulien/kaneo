import { describe, expect, it } from "vitest";
import { formatTaskNumber, taskNumberLabel } from "./task-number";

describe("formatTaskNumber", () => {
  it("renders a compact hash id", () => {
    expect(formatTaskNumber(7)).toBe("#7");
    expect(formatTaskNumber(292)).toBe("#292");
  });

  it("hides missing or invalid numbers", () => {
    expect(formatTaskNumber(null)).toBeNull();
    expect(formatTaskNumber(undefined)).toBeNull();
    expect(formatTaskNumber(0)).toBeNull();
    expect(formatTaskNumber(-1)).toBeNull();
  });
});

describe("taskNumberLabel", () => {
  it("keeps slug-number as the human permalink", () => {
    expect(taskNumberLabel("sp-produit", 42)).toBe("sp-produit-42");
    expect(taskNumberLabel("  infra  ", 8)).toBe("infra-8");
  });

  it("falls back to #N when the project has no slug", () => {
    expect(taskNumberLabel(null, 42)).toBe("#42");
    expect(taskNumberLabel("", 42)).toBe("#42");
  });
});
