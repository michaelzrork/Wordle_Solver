import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WORD_LISTS, getWordList, listsForLength, supportsLength } from "./wordlists";

describe("word list metadata", () => {
  it("falls back to the first list for an unknown id", () => {
    expect(getWordList("nope").id).toBe(WORD_LISTS[0].id);
  });

  it("offers every list for five-letter games", () => {
    expect(listsForLength(5).map((list) => list.id)).toEqual(["wordle", "stanford", "scrabble"]);
  });

  it("offers only the full dictionary for other lengths", () => {
    expect(listsForLength(7).map((list) => list.id)).toEqual(["scrabble"]);
    expect(supportsLength(getWordList("wordle"), 7)).toBe(false);
  });
});

describe("shipped word lists", () => {
  it.each(WORD_LISTS)("$name is lowercase a-z, one word per line", (list) => {
    const words = readFileSync(`public${list.file}`, "utf8").split("\n").filter(Boolean);
    expect(words.length).toBeGreaterThan(1000);
    expect(words.every((word) => /^[a-z]+$/.test(word))).toBe(true);
  });

  it.each(WORD_LISTS)("$name covers the lengths it claims", (list) => {
    const words = readFileSync(`public${list.file}`, "utf8").split("\n").filter(Boolean);
    const lengths = list.lengths === "any" ? [2, 5, 9, 15] : list.lengths;
    for (const length of lengths) {
      expect(words.some((word) => word.length === length)).toBe(true);
    }
  });
});
