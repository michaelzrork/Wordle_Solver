/**
 * Refreshes public/wordlists/nyt.txt — every word Wordle accepts as a guess.
 *
 * The list is not published anywhere; it ships inside the game's own JavaScript.
 * The page loads a few dozen hashed bundles, exactly one of which holds a long
 * array of five-letter strings, so this walks them and takes the array. The
 * bundle hashes change whenever the NYT ships, which is why the URLs are read
 * from the page rather than pinned.
 *
 * Run with `npm run build:nytlist`. It is the only list the game itself defines,
 * so it is worth re-running every few months — and worth re-checking coverage
 * against the puzzle archive when you do.
 */

import { writeFileSync } from "node:fs";

const WORDLE = "https://www.nytimes.com/games/wordle/index.html";
const OUT = "public/wordlists/nyt.txt";

/** Bundle URLs the game page pulls in, in the order it lists them. */
export function bundleUrls(html) {
  const matches = html.matchAll(/https:\/\/www\.nytimes\.com\/games-assets\/[\w/.-]+\.js/g);
  return [...new Set([...matches].map((match) => match[0]))];
}

/**
 * The word list inside one bundle, or null when it holds no such array.
 *
 * Wordle's dictionary is a single array literal of five-letter strings — the
 * playable words sorted, then the original answer list shuffled onto the end.
 * Nothing else in the bundles comes close to that length, so the size test is
 * enough to tell it apart from an ordinary array of strings.
 */
export function extractWords(source) {
  let longest = null;

  for (const match of source.matchAll(/\[(?:"[a-z]{5}",){999,}"[a-z]{5}"\]/g)) {
    const words = [...match[0].matchAll(/"([a-z]{5})"/g)].map((word) => word[1]);
    if (!longest || words.length > longest.length) longest = words;
  }

  return longest;
}

async function text(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} — ${response.status}`);
  return response.text();
}

async function main() {
  const urls = bundleUrls(await text(WORDLE));
  if (urls.length === 0) throw new Error("No game bundles found — the page markup changed.");

  for (const url of urls) {
    const words = extractWords(await text(url));
    if (!words) continue;

    const sorted = [...new Set(words)].sort();
    writeFileSync(OUT, `${sorted.join("\n")}\n`);
    console.log(`Wrote ${OUT} (${sorted.length} words) from ${url}`);
    return;
  }

  throw new Error(`No word list in ${urls.length} bundles — the game's data layout changed.`);
}

// Only fetch when run directly, so tests can import the parsing on its own.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  await main();
}
