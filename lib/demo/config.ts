/**
 * Demo mode — the switch that lets the frontend run without its backend.
 *
 * The full backend is a Kafka/Mongo/Postgres microservice stack with three
 * Python ML services and two LLM integrations. There is no free host that will
 * run it, so the public demo ships the frontend alone and replays real output
 * captured from that backend into the same code paths the live app uses.
 *
 * What this is NOT: mock data. Every number a visitor sees in demo mode came
 * out of the real models — the T+5 price ensemble, the dividend-cut model, the
 * Gemini filing parser, the SVR Z-score model — captured by
 * `scripts/demo/harvest-*.mjs` against a running stack. The market-risk
 * statistics are computed from real CSE closing prices and say so.
 *
 * The real fetch code is untouched and still the default. Turning this flag
 * off restores live backend calls with no other change.
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === '1';

/** Where the harvested fixtures are served from. */
export const DEMO_DATA_BASE = '/demo-data';

/** Per-company support flags, mirroring `ModuleSupport` plus computed stats. */
export interface DemoModuleSupport {
  name: string;
  predict: boolean;
  dividend: boolean;
  risk: boolean;
  stats: boolean;
}

export interface DemoManifest {
  capturedAt: string;
  counts: {
    companies: number;
    predict: number;
    dividend: number;
    health: number;
    stats: number;
    sentiment: number;
  };
  provenance: {
    predict: string;
    dividend: string;
    health: string;
    stats: string;
    sentiment: string | null;
  };
  sentiment: {
    count: number;
    modes: string[];
    curation: {
      candidates: number;
      accepted: number;
      rejected: number;
      basis: string;
      reasons: Array<{ ticker: string; reason: string }>;
    } | null;
  };
  modules: Record<string, DemoModuleSupport>;
}

let manifestPromise: Promise<DemoManifest | null> | null = null;

/**
 * The manifest, fetched once per page session.
 *
 * Returns null rather than throwing when it cannot be read: a demo that loses
 * its manifest should degrade to "no company is known to have data" and let the
 * existing empty states speak, not crash the shell.
 */
export function loadDemoManifest(): Promise<DemoManifest | null> {
  if (!DEMO_MODE) return Promise.resolve(null);
  if (manifestPromise) return manifestPromise;

  manifestPromise = fetch(`${DEMO_DATA_BASE}/manifest.json`)
    .then((response) => (response.ok ? (response.json() as Promise<DemoManifest>) : null))
    .catch(() => null);

  return manifestPromise;
}
