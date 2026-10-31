import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";

/** Arabic text (titles 700, body 400). */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

/** Taqbaylit (Latin), numerals and durations. Includes ɛ ɣ ḍ ḥ ṛ ṣ ṭ ẓ č ǧ. */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const fontVariables = `${plexArabic.variable} ${inter.variable}`;
