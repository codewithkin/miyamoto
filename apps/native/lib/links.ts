/**
 * Public pages on the marketing site that the app links to.
 *
 * One place, because the welcome screen's legal line and settings must never
 * point at different policies.
 */
const SITE = "https://miyamoto.app";

export const LINKS = {
  privacy: `${SITE}/privacy`,
  terms: `${SITE}/terms`,
  support: `${SITE}/support`,
} as const;
