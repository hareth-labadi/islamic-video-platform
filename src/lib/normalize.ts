/*
 * Text folding for search: lowercase, no Arabic diacritics or tatweel, one form
 * for alef / ya / ta marbuta / hamza seats, Arabic-Indic digits as Western
 * digits, no Latin accents (é → e, ḥ → h). Each character folds to at most one
 * character, so a match in the folded text maps straight back to the original
 * (used to highlight matches).
 */

const DROP = /[ً-ٰٟـ̀-ͯ]/;
const MAP: Record<string, string> = {
  "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
  "ى": "ي", "ئ": "ي",
  "ؤ": "و",
  "ة": "ه",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "’": "'", "ʼ": "'",
};

function fold(ch: string): string {
  if (DROP.test(ch)) return "";
  if (MAP[ch]) return MAP[ch];
  const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return (base[0] ?? "").toLowerCase()[0] ?? "";
}

/** Folded text plus, for each folded character, its index in the original. */
function foldWithMap(text: string): { folded: string; map: number[] } {
  let folded = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const f = fold(text[i]);
    if (f) {
      folded += f;
      map.push(i);
    }
  }
  return { folded, map };
}

export function normalize(text: string): string {
  return foldWithMap(text).folded.replace(/\s+/g, " ").trim();
}

/** Query words, folded. */
export function tokenize(query: string): string[] {
  return normalize(query).split(" ").filter(Boolean);
}

/*
 * A word matches at the START of a word in the text, after optional Arabic
 * prefixes (و ف ب ك ل and the article ال / لل). So «صلاة» finds «والصلاة»,
 * «etud» finds «études», but «نية» does not match inside «الثانية».
 * A typed article is optional: «النية» also finds «نية».
 */
const PREFIXES = "(?:[وفبكل]?ال|لل|[وفبكل])?";
const patterns = new Map<string, RegExp>();

function core(token: string): string {
  return token.length > 3 && token.startsWith("ال") ? token.slice(2) : token;
}

function pattern(token: string): RegExp {
  let re = patterns.get(token);
  if (!re) {
    const escaped = core(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    re = new RegExp(`(^|[^\\p{L}\\p{N}])(${PREFIXES})(${escaped})`, "gu");
    patterns.set(token, re);
  }
  re.lastIndex = 0;
  return re;
}

/** Does the (already folded) text contain this token at a word start? */
export function hasToken(foldedText: string, token: string): boolean {
  return pattern(token).test(foldedText);
}

/** Ranges [start, end) in the ORIGINAL text where any query word matches. Merged and sorted. */
export function matchRanges(text: string, query: string): Array<[number, number]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const { folded, map } = foldWithMap(text);
  const ranges: Array<[number, number]> = [];
  for (const token of tokens) {
    const re = pattern(token);
    // Highlight the article too when the visitor typed it («الصلاة» → «الصلاة», not «صلاة»).
    const withPrefix = token !== core(token);
    for (let m = re.exec(folded); m; m = re.exec(folded)) {
      const from = m.index + m[1].length + (withPrefix ? 0 : m[2].length);
      const last = m.index + m[0].length - 1;
      // Keep trailing diacritics inside the highlight so letters and their marks stay together.
      let end = map[last] + 1;
      while (end < text.length && DROP.test(text[end])) end++;
      ranges.push([map[from], end]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const prev = merged[merged.length - 1];
    if (prev && r[0] <= prev[1]) prev[1] = Math.max(prev[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}
