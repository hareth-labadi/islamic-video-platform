// Switches the "Arabic/…" text styles and any remaining Arabic text to
// IBM Plex Sans Arabic, keeping each weight. Runs inside your Figma app,
// so it can use the font installed on your computer.

const FAMILY = "IBM Plex Sans Arabic";
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

// Normalised weight name -> style names to try, in order.
const CANDIDATES = {
  thin: ["Thin"],
  extralight: ["ExtraLight", "Extra Light"],
  light: ["Light"],
  regular: ["Regular"],
  medium: ["Medium"],
  semibold: ["SemiBold", "Semi Bold", "Semibold"],
  bold: ["Bold"],
  extrabold: ["ExtraBold", "Extra Bold", "Bold"],
  black: ["Black", "ExtraBold", "Extra Bold", "Bold"],
};

function weightKey(style) {
  const s = style.toLowerCase().replace(/[\s_-]/g, "");
  if (s.includes("extrabold")) return "extrabold";
  if (s.includes("semibold")) return "semibold";
  if (s.includes("extralight")) return "extralight";
  for (const k of ["black", "bold", "medium", "light", "thin"]) if (s.includes(k)) return k;
  return "regular";
}

async function main() {
  const available = (await figma.listAvailableFontsAsync())
    .filter((f) => f.fontName.family === FAMILY)
    .map((f) => f.fontName.style);
  if (available.length === 0) {
    figma.closePlugin(`${FAMILY} isn't available to Figma. Install it, restart Figma, and run this again.`);
    return;
  }

  const loaded = new Set();
  async function plexFor(style) {
    const pick = CANDIDATES[weightKey(style)].find((c) => available.includes(c)) || "Regular";
    const font = { family: FAMILY, style: pick };
    if (!loaded.has(pick)) {
      await figma.loadFontAsync(font);
      loaded.add(pick);
    }
    return font;
  }
  async function load(font) {
    const key = `${font.family}|${font.style}`;
    if (!loaded.has(key)) {
      await figma.loadFontAsync(font);
      loaded.add(key);
    }
  }

  // 1) Text styles named "Arabic/…".
  let stylesChanged = 0;
  const arabicStyleIds = new Set();
  for (const s of await figma.getLocalTextStylesAsync()) {
    if (!s.name.startsWith("Arabic/")) continue;
    arabicStyleIds.add(s.id);
    if (s.fontName.family === FAMILY) continue;
    await load(s.fontName);
    s.fontName = await plexFor(s.fontName.style);
    stylesChanged++;
  }

  // 2) Arabic text without one of those styles: apply the matching "Arabic/…"
  //    style (same size, weight and line height), otherwise just switch the font.
  const arabicStyles = (await figma.getLocalTextStylesAsync()).filter((s) => arabicStyleIds.has(s.id));
  const styleKey = (size, style, lh) => `${Math.round(size * 10) / 10}|${weightKey(style)}|${lh}`;
  const byKey = new Map(
    arabicStyles.map((s) => [styleKey(s.fontSize, s.fontName.style, s.lineHeight.unit === "PIXELS" ? Math.round(s.lineHeight.value) : "auto"), s]),
  );

  let styled = 0;
  let rangesChanged = 0;
  for (const page of figma.root.children) {
    await page.loadAsync();
    for (const t of page.findAllWithCriteria({ types: ["TEXT"] })) {
      if (!ARABIC.test(t.characters)) continue;
      for (const seg of t.getStyledTextSegments(["fontName", "fontSize", "lineHeight", "textStyleId"])) {
        if (!ARABIC.test(seg.characters)) continue;
        if (seg.textStyleId && arabicStyleIds.has(seg.textStyleId)) continue;
        await load(seg.fontName);
        const lh = seg.lineHeight.unit === "PIXELS" ? Math.round(seg.lineHeight.value) : "auto";
        const match = byKey.get(styleKey(seg.fontSize, seg.fontName.style, lh));
        if (match) {
          await t.setRangeTextStyleIdAsync(seg.start, seg.end, match.id);
          styled++;
        } else if (seg.fontName.family !== FAMILY) {
          t.setRangeFontName(seg.start, seg.end, await plexFor(seg.fontName.style));
          rangesChanged++;
        }
      }
    }
  }

  figma.closePlugin(
    `Done: ${stylesChanged} Arabic styles switched to ${FAMILY}, ${styled} Arabic text ranges styled, ${rangesChanged} more switched to ${FAMILY}.`,
  );
}

main().catch((e) => figma.closePlugin(`Stopped: ${e.message}`));
