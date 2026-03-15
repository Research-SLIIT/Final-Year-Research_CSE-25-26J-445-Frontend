import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js navigation globally
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock EventSource globally (jsdom does not implement it)
// Must be a vi.fn() so mock.instances is accessible in tests
const MockEventSource = vi.fn().mockImplementation(function (this: any, url: string) {
  this.url = url;
  this.onmessage = null;
  this.onerror = null;
  this.close = vi.fn();
});

vi.stubGlobal("EventSource", MockEventSource);

// Suppress Recharts SVG ResizeObserver errors in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console.log and console.error noise in tests
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
