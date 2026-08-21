import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_LIST_ID, WORD_LISTS, getWordList, listsForLength, supportsLength } from "./wordlists";

describe("word list metadata", () => {
  it("falls back to the first list for an unknown id", () => {
    expect(getWordList("nope").id).toBe(WORD_LISTS[0].id);
  });

  it("offers every list for five-letter games, the default first", () => {
    expect(listsForLength(5).map((list) => list.id)).toEqual(["common", "wordle", "scrabble"]);
  });

  it("defaults to a list that covers more than the original answers", () => {
    expect(getWordList(DEFAULT_LIST_ID).id).toBe("common");
    expect(getWordList("common").files.length).toBeGreaterThan(1);
  });

  it("offers only the full dictionary for other lengths", () => {
    expect(listsForLength(7).map((list) => list.id)).toEqual(["scrabble"]);
    expect(supportsLength(getWordList("common"), 7)).toBe(false);
  });
});

describe("shipped word lists", () => {
  const read = (list: (typeof WORD_LISTS)[number]) => [
    ...new Set(list.files.flatMap((file) => readFileSync(`public${file}`, "utf8").split("\n").filter(Boolean))),
  ];

  it.each(WORD_LISTS)("$name is lowercase a-z, one word per line", (list) => {
    const words = read(list);
    expect(words.length).toBeGreaterThan(1000);
    expect(words.every((word) => /^[a-z]+$/.test(word))).toBe(true);
  });

  it.each(WORD_LISTS)("$name covers the lengths it claims", (list) => {
    const words = read(list);
    const lengths = list.lengths === "any" ? [2, 5, 9, 15] : list.lengths;
    for (const length of lengths) {
      expect(words.some((word) => word.length === length)).toBe(true);
    }
  });

  it("the default list holds words the original answer list is missing", () => {
    const common = read(getWordList("common"));
    const original = read(getWordList("wordle"));
    // ASPIC was a real solution that the shipped answer list never held.
    expect(common).toContain("aspic");
    expect(original).not.toContain("aspic");
    // ...and it keeps every original answer, which Stanford alone does not.
    expect(original.every((word) => common.includes(word))).toBe(true);
  });
});
