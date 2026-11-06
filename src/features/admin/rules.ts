/*
 * Business rules shared by the forms, the demo backend and docs/specs/admin-api.md.
 * The real backend must enforce the same numbers; change them here and in the spec together.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const limits = {
  video: { titleMin: 3, title: 160, summary: 200, description: 5000, topics: 10 },
  /** A visitor's question (the team may shorten it to remove personal details). */
  questionBody: { min: 20, max: 1500 },
  /** Series and playlists. */
  collection: { titleMin: 2, title: 120, tagline: 120, description: 2000, slug: 60, glyph: 3 },
  sheikh: { nameMin: 3, name: 80, honorific: 40, bio: 300 },
  /** TikTok profile import: at most this many new clips, newest first (empty = every new clip). */
  importClips: { max: 50 },
  /** Longest voice answer the recorder accepts. */
  voiceAnswerSeconds: 300,
  /** Sign-in code sent by e-mail. */
  codeLength: 6,
} as const;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Length check for a question body after trimming: "short", "long" or null when valid. */
export function questionBodyProblem(body: string): "short" | "long" | null {
  const length = body.trim().length;
  if (length < limits.questionBody.min) return "short";
  if (length > limits.questionBody.max) return "long";
  return null;
}

/** A profile-import limit typed by the user: undefined when empty, null when invalid. */
export function parseImportLimit(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= limits.importClips.max ? n : null;
}
