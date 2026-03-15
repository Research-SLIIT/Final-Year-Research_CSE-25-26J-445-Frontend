import { describe, it, expect } from "vitest";
import {
  getZScoreZone,
  getZoneColor,
  getHealthStatusColor,
  getScoreColor,
  formatPercentage,
} from "@/lib/risk-helpers";

describe("getZScoreZone", () => {
  it('returns "Safe" for z-score above 2.99', () => {
    expect(getZScoreZone(3.0)).toBe("Safe");
    expect(getZScoreZone(5.0)).toBe("Safe");
  });

  it('returns "Grey" for z-score between 1.81 and 2.99 (inclusive)', () => {
    expect(getZScoreZone(2.99)).toBe("Grey");
    expect(getZScoreZone(2.5)).toBe("Grey");
    expect(getZScoreZone(1.81)).toBe("Grey");
  });

  it('returns "Distress" for z-score below 1.81', () => {
    expect(getZScoreZone(1.80)).toBe("Distress");
    expect(getZScoreZone(0)).toBe("Distress");
    expect(getZScoreZone(-1)).toBe("Distress");
  });
});

describe("getZoneColor", () => {
  it("returns green classes for Safe zone", () => {
    const color = getZoneColor("Safe");
    expect(color).toContain("green");
  });

  it("returns yellow classes for Grey zone", () => {
    const color = getZoneColor("Grey");
    expect(color).toContain("yellow");
  });

  it("returns red classes for Distress zone", () => {
    const color = getZoneColor("Distress");
    expect(color).toContain("red");
  });

  it("returns muted classes for unknown zone", () => {
    const color = getZoneColor("Unknown");
    expect(color).toContain("muted");
  });
});

describe("getHealthStatusColor", () => {
  it("returns green for Excellent", () => {
    expect(getHealthStatusColor("Excellent")).toContain("green");
  });

  it("returns blue for Good", () => {
    expect(getHealthStatusColor("Good")).toContain("blue");
  });

  it("returns yellow for Average", () => {
    expect(getHealthStatusColor("Average")).toContain("yellow");
  });

  it("returns orange for Poor", () => {
    expect(getHealthStatusColor("Poor")).toContain("orange");
  });

  it("returns red for Critical", () => {
    expect(getHealthStatusColor("Critical")).toContain("red");
  });

  it("returns muted for unknown status", () => {
    expect(getHealthStatusColor("N/A")).toContain("muted");
  });
});

describe("getScoreColor", () => {
  it('returns "#22c55e" green for score >= 90', () => {
    expect(getScoreColor(90)).toBe("#22c55e");
    expect(getScoreColor(100)).toBe("#22c55e");
  });

  it('returns "#3b82f6" blue for score >= 70', () => {
    expect(getScoreColor(70)).toBe("#3b82f6");
    expect(getScoreColor(89)).toBe("#3b82f6");
  });

  it('returns "#f59e0b" amber for score >= 50', () => {
    expect(getScoreColor(50)).toBe("#f59e0b");
    expect(getScoreColor(69)).toBe("#f59e0b");
  });

  it('returns "#f97316" orange for score >= 30', () => {
    expect(getScoreColor(30)).toBe("#f97316");
    expect(getScoreColor(49)).toBe("#f97316");
  });

  it('returns "#ef4444" red for score below 30', () => {
    expect(getScoreColor(29)).toBe("#ef4444");
    expect(getScoreColor(0)).toBe("#ef4444");
  });
});

describe("formatPercentage", () => {
  it("multiplies value by 100 and appends %", () => {
    expect(formatPercentage(0.5)).toBe("50.00%");
    expect(formatPercentage(1)).toBe("100.00%");
    expect(formatPercentage(0)).toBe("0.00%");
  });

  it("formats to 2 decimal places", () => {
    expect(formatPercentage(0.1234)).toBe("12.34%");
    expect(formatPercentage(0.001)).toBe("0.10%");
  });
});
