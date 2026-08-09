import { describe, it, expect, beforeEach, vi } from "vitest";
import { cachedRequest, peekCache, invalidateCache } from "@/lib/request-cache";

beforeEach(() => {
  invalidateCache();
});

describe("request cache", () => {
  it("runs the factory once for repeated calls on the same key", async () => {
    const factory = vi.fn().mockResolvedValue("value");

    await cachedRequest("k", factory);
    await cachedRequest("k", factory);
    await cachedRequest("k", factory);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("shares an in-flight request instead of racing duplicates", async () => {
    // This is the tab-switch case: two mounts asking at once must not produce
    // two network calls just because neither has settled yet.
    const factory = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve("value"), 20))
    );

    const [a, b] = await Promise.all([
      cachedRequest("k", factory),
      cachedRequest("k", factory),
    ]);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toBe("value");
    expect(b).toBe("value");
  });

  it("keeps separate keys separate", async () => {
    const factory = vi.fn().mockImplementation((v: string) => Promise.resolve(v));

    const a = await cachedRequest("a", () => factory("a"));
    const b = await cachedRequest("b", () => factory("b"));

    expect(a).toBe("a");
    expect(b).toBe("b");
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("re-runs the factory when force is set", async () => {
    const factory = vi.fn().mockResolvedValue("value");

    await cachedRequest("k", factory);
    await cachedRequest("k", factory, { force: true });

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("does not cache failures, so the next attempt retries", async () => {
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    await expect(cachedRequest("k", factory)).rejects.toThrow("boom");
    await expect(cachedRequest("k", factory)).resolves.toBe("recovered");
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("peek returns nothing until the request settles", async () => {
    let release: (value: string) => void = () => {};
    const pending = cachedRequest("k", () => new Promise<string>((r) => { release = r }));

    expect(peekCache("k")).toBeUndefined();

    release("value");
    await pending;

    expect(peekCache("k")).toBe("value");
  });

  it("peek does not trigger a request for an unknown key", () => {
    expect(peekCache("never-fetched")).toBeUndefined();
  });

  it("invalidates by prefix only", async () => {
    await cachedRequest("stream:a", () => Promise.resolve(1));
    await cachedRequest("profile:a", () => Promise.resolve(2));

    invalidateCache("stream:");

    expect(peekCache("stream:a")).toBeUndefined();
    expect(peekCache("profile:a")).toBe(2);
  });
});
