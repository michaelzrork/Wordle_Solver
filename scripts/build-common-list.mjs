/**
 * Builds public/wordlists/common.txt — the default answer list.
 *
 * Neither source list covers the game on its own. The official answer list is
 * the set Wordle shipped with, and the puzzle has since used words outside it
 * (ASPIC). Knuth's Stanford list has those, but it is a word list rather than
 * an answer list: it carries ~1,600 plural and third-person -S forms, and a
 * Wordle answer is never one of those. So: every official answer, plus the
 * Stanford words that could plausibly be an answer.
 *
 * Run with `npm run build:wordlist` after changing a source list.
 */

import { readFileSync, writeFileSync } from "node:fs";

const WORDLISTS = "public/wordlists";

const read = (file) =>
  readFileSync(`${WORDLISTS}/${file}`, "utf8")
    .split("\n")
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);

/**
 * Does this look like a plural or third-person form of a shorter word?
 *
 * `stems` maps a length to the words of that length, used to decide whether
 * what is left after removing the ending is itself a word. Doubled endings
 * ("bliss", "chess") are never plurals, so they are exempt outright.
 */
export function isPluralForm(word, stems) {
  if (!word.endsWith("s") || word.endsWith("ss")) return false;

  const has = (candidate) => stems.get(candidate.length)?.has(candidate) ?? false;

  if (has(word.slice(0, -1))) return true; // backs -> back
  if (word.endsWith("es") && has(word.slice(0, -2))) return true; // boxes -> box
  if (word.endsWith("ies") && has(`${word.slice(0, -3)}y`)) return true; // flies -> fly
  if (word.endsWith("ves") && (has(`${word.slice(0, -3)}f`) || has(`${word.slice(0, -3)}fe`))) {
    return true; // elves -> elf, wives -> wife
  }

  return false;
}

/**
 * Every official answer, plus the Stanford words that are not plural forms.
 *
 * Official answers are never filtered: they are known-good by definition, and
 * a few of them ("brass", "amiss") would trip the heuristic otherwise.
 */
export function buildCommonList(answers, stanford, dictionary) {
  const stems = new Map();
  for (const word of dictionary) {
    if (word.length > 4) continue;
    if (!stems.has(word.length)) stems.set(word.length, new Set());
    stems.get(word.length).add(word);
  }

  const official = new Set(answers);
  const words = new Set(official);
  for (const word of stanford) {
    if (!official.has(word) && !isPluralForm(word, stems)) words.add(word);
  }

  return [...words].sort();
}

export function buildFromVendoredLists() {
  return buildCommonList(read("wordle-answers.txt"), read("stanford.txt"), read("scrabble.txt"));
}

// Only write the file when run directly, so tests can import the builder.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const words = buildFromVendoredLists();
  writeFileSync(`${WORDLISTS}/common.txt`, `${words.join("\n")}\n`);
  console.log(`Wrote ${WORDLISTS}/common.txt (${words.length} words)`);
}
