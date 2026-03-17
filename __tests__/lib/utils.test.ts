import { describe, it, expect } from "vitest";
import { cn, normalizeSymbol } from "@/lib/utils";

describe("normalizeSymbol", () => {
  it("strips .N0000 suffix from a symbol", () => {
    expect(normalizeSymbol("AAF.N0000")).toBe("AAF");
  });

  it("strips .N0001 and other numeric suffixes", () => {
    expect(normalizeSymbol("LOLC.N0001")).toBe("LOLC");
    expect(normalizeSymbol("JKH.N9999")).toBe("JKH");
  });

  it("returns symbol unchanged when no .N suffix is present", () => {
    expect(normalizeSymbol("AAF")).toBe("AAF");
    expect(normalizeSymbol("LOLC")).toBe("LOLC");
  });

  it("returns empty string unchanged", () => {
    expect(normalizeSymbol("")).toBe("");
  });
});

describe("cn", () => {
  it("merges multiple class strings", () => {
    const result = cn("foo", "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("omits falsy conditional classes", () => {
    const result = cn("foo", false && "bar", undefined, "baz");
    expect(result).toContain("foo");
    expect(result).toContain("baz");
    expect(result).not.toContain("bar");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });
});
