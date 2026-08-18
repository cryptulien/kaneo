import { describe, expect, it } from "vitest";
import { environmentSortRank, isTaskEnvironment } from "./environment";

describe("environment helpers", () => {
  it("orders dev before preprod before prod, unset last", () => {
    expect(environmentSortRank("dev")).toBeLessThan(
      environmentSortRank("preprod"),
    );
    expect(environmentSortRank("preprod")).toBeLessThan(
      environmentSortRank("prod"),
    );
    expect(environmentSortRank("prod")).toBeLessThan(environmentSortRank(null));
    expect(isTaskEnvironment("staging")).toBe(false);
  });
});
