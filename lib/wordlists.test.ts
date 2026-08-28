import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIST_ID,
  WORD_LISTS,
  getWordList,
  listsForLength,
  supportsLength,
  widestListForLength,
} from "./wordlists";

describe("word list metadata", () => {
  it("falls back to the first list for an unknown id", () => {
    expect(getWordList("nope").id).toBe(WORD_LISTS[0].id);
  });

  it("offers every list for five-letter games, the default first", () => {
    expect(listsForLength(5).map((list) => list.id)).toEqual(["nyt", "common", "wordle", "scrabble"]);
  });

  it("defaults to the list the game itself defines", () => {
    expect(getWordList(DEFAULT_LIST_ID).id).toBe("nyt");
    expect(getWordList("common").sources.length).toBe(2);
  });

  it("picks the game's own list to widen to at five letters", () => {
    expect(widestListForLength(5)?.id).toBe("nyt");
  });

  it("picks the Scrabble dictionary at every other length, being the only one", () => {
    for (const length of [2, 7, 12, 15]) {
      expect(widestListForLength(length)?.id).toBe("scrabble");
    }
  });

  it("offers only the full dictionary for other lengths", () => {
    expect(listsForLength(7).map((list) => list.id)).toEqual(["scrabble"]);
    expect(supportsLength(getWordList("common"), 7)).toBe(false);
  });
});

describe("shipped word lists", () => {
  const read = (list: (typeof WORD_LISTS)[number]) =>
    readFileSync(`public${list.file}`, "utf8").split("\n").filter(Boolean);

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

  it("the widest list holds every word the others do, so widening loses nothing", () => {
    // What the widen button rests on. Without this a switch could drop a
    // candidate the player could already see, which would read as a bug.
    const widest = widestListForLength(5);
    expect(widest?.id).toBe("nyt");
    const all = new Set(read(widest!));

    for (const list of WORD_LISTS) {
      if (list.id === widest!.id || !supportsLength(list, 5)) continue;
      const missing = read(list)
        .filter((word) => word.length === 5)
        .filter((word) => !all.has(word));
      expect({ list: list.id, missing }).toEqual({ list: list.id, missing: [] });
    }
  });

  it("the Scrabble dictionary is not a superset, so it is never the one offered", () => {
    // ADMIN and INBOX were both real answers; Scrabble carries neither. This is
    // why `breadth` only promises something about its top entry.
    const scrabble = new Set(read(getWordList("scrabble")));
    expect(read(getWordList("common")).filter((word) => !scrabble.has(word))).toEqual([
      "admin",
      "inbox",
    ]);
  });

  it("the likely-answers list is free of plurals, unlike the raw Stanford list", () => {
    const common = read(getWordList("common"));
    const plurals = common.filter((word) => word.endsWith("s") && !word.endsWith("ss"));
    // A handful of genuine singulars survive (atlas, bogus, corps); the ~1,600
    // plural forms Stanford carries do not.
    expect(plurals.length).toBeLessThan(120);
  });
});
