/**
 * Cropped screenshots of the GitHub screens the setup, join and token steps send people to.
 * GitHub's UI is English only, so one image serves both languages; the alt text is translated.
 * Files live in `public/img/help/<id>.webp` (same origin, so the CSP stays unchanged).
 */
export const SHOT_IDS = [
  'org-new',
  'repo-new',
  'base-permission',
  'token-policy',
  'org-invite',
  'repo-access',
  'token-form',
  'token-permissions',
  'invitation',
] as const
export type ShotId = (typeof SHOT_IDS)[number]

/** Screenshots that exist in `public/img/help/`; a new id stays hidden until its file is added. */
export const AVAILABLE_SHOTS: ReadonlySet<ShotId> = new Set<ShotId>(SHOT_IDS)

/**
 * Display size in CSS px. The files are about twice as large (sharp on high-density screens), and
 * the size keeps GitHub's text at roughly the app's small text size so the images don't dominate.
 */
export const SHOT_SIZES: Record<ShotId, { width: number; height: number }> = {
  'org-new': { width: 511, height: 270 },
  'repo-new': { width: 606, height: 188 },
  'base-permission': { width: 342, height: 79 },
  'token-policy': { width: 669, height: 103 },
  'org-invite': { width: 219, height: 36 },
  'repo-access': { width: 302, height: 39 },
  'token-form': { width: 516, height: 149 },
  'token-permissions': { width: 744, height: 99 },
  invitation: { width: 458, height: 116 },
}
