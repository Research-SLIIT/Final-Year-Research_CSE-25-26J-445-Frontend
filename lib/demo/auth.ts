/**
 * Demo session.
 *
 * Sign-in is OTP-gated against auth-service, which the demo does not have, so
 * there is nothing to authenticate against. Rather than park a visitor at a
 * login wall they cannot pass, demo mode starts them signed in as a premium
 * user — every feature reachable in the first click.
 *
 * The user is openly labelled as a demo account. Nothing here mints or accepts
 * a token: `apiClient` is never reached in demo mode, so there is no privilege
 * to escalate — this only decides what the shell renders.
 */

import type { User } from '@/stores/useAuthStore';

export const DEMO_USER: User = {
  id: 'demo-user',
  name: 'Demo Visitor',
  email: 'demo@cse-insights.example',
  displayName: 'Demo Visitor',
  bio: 'Exploring the CSE Insights demo — every analysis on this account is real captured model output.',
  joinedDate: new Date('2026-01-01').toISOString(),
  isPremium: true,
};

/**
 * Marks the stored session as belonging to the demo, so a browser that has
 * both a real session and a demo session cannot confuse the two.
 */
export const DEMO_TOKEN = 'demo-session';
