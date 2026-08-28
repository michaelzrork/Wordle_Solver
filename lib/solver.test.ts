import { describe, expect, it } from "vitest";
import {
  deriveConstraints,
  filterByPartial,
  filterWords,
  keyboardState,
  matchesGuess,
  matchesPartialGuess,
  patternKey,
  rankGuesses,
  scoreGuess,
  scorePartialGuess,
  type Guess,
  type Mark,
  type PartialGuess,
} from "./solver";

const marks = (pattern: string): Mark[] =>
  [...pattern].map((c): Mark => (c === "g" ? "green" : c === "y" ? "yellow" : "gray"));

const guess = (word: string, pattern: string): Guess => ({ word, marks: marks(pattern) });

/** A partly typed row: "." stands for a position with no letter yet. */
const draft = (typed: string, pattern: string): PartialGuess => ({
  letters: [...typed].map((c) => (c === "." ? "" : c)),
  marks: marks(pattern),
});

const partialKey = (scored: (Mark | null)[]): string =>
  scored.map((m) => (m === null ? "." : m === "green" ? "g" : m === "yellow" ? "y" : "b")).join("");

describe("scoreGuess", () => {
  it("marks an exact match all green", () => {
    expect(patternKey(scoreGuess("crane", "crane"))).toBe("ggggg");
  });

  it("marks misplaced letters yellow", () => {
    expect(patternKey(scoreGuess("crane", "nacre"))).toBe("yyyyg");
  });

  it("only colors as many repeats as the answer holds", () => {
    // "abbey" holds two Bs, so both Bs of "babes" color — one green, one yellow.
    expect(patternKey(scoreGuess("babes", "abbey"))).toBe("yyggb");
  });

  it("prefers greens over yellows for repeated letters", () => {
    // "rebel" has two Es: one is claimed green, the other colors the leading
    // E yellow, and the trailing E of "eerie" is left gray.
    expect(patternKey(scoreGuess("eerie", "rebel"))).toBe("ygybb");
  });

  it("grays every repeat when the answer has none", () => {
    expect(patternKey(scoreGuess("geese", "abhor"))).toBe("bbbbb");
  });
});

describe("matchesGuess", () => {
  it("keeps a candidate that would produce the same colors", () => {
    expect(matchesGuess("abbey", guess("babes", "yyggb"))).toBe(true);
  });

  it("rejects a candidate with too many of a repeated letter", () => {
    // Two colored Bs mean the answer holds two, and both Bs of "bobby" would
    // land differently.
    expect(matchesGuess("bobby", guess("babes", "yyggb"))).toBe(false);
  });

  it("rejects a candidate missing a required letter", () => {
    expect(matchesGuess("about", guess("crane", "bbbbg"))).toBe(false);
  });

  it("rejects a candidate that repeats a letter ruled out at a position", () => {
    expect(matchesGuess("crane", guess("crane", "ybggg"))).toBe(false);
  });
});

describe("filterWords", () => {
  const words = ["abbey", "bobby", "crane", "nacre", "eerie", "rebel", "shale", "shame"];

  it("returns the whole list when nothing has been guessed", () => {
    expect(filterWords(words, [])).toEqual(words);
  });

  it("narrows the list across several guesses", () => {
    const result = filterWords(words, [guess("crane", "bbgbg"), guess("shale", "gggbg")]);
    expect(result).toEqual(["shame"]);
  });

  it("handles the duplicate-letter case the CLI struggled with", () => {
    // Leading E yellow, second E green, trailing E gray: the answer holds
    // exactly two Es, one of them in position two.
    const pool = ["eerie", "rebel", "epees", "sever"];
    expect(filterWords(pool, [guess("eerie", "ggggg")])).toEqual(["eerie"]);
    expect(filterWords(pool, [guess("eerie", "ygybb")])).toEqual(["rebel", "sever"]);
  });

  it("drops words of the wrong length", () => {
    expect(filterWords(["crane", "cranes"], [guess("crane", "ggggg")])).toEqual(["crane"]);
  });
});

describe("deriveConstraints", () => {
  it("records greens, yellows and absences", () => {
    const { greens, notAt, absent } = deriveConstraints([guess("crane", "gybby")], 5);
    expect(greens).toEqual(["c", "", "", "", ""]);
    expect([...notAt[1]]).toEqual(["r"]);
    expect(absent).toEqual(new Set(["a", "n"]));
  });

  it("does not exclude a letter that is gray elsewhere but present", () => {
    // The first B is gray only because the second one is green: the answer
    // holds exactly one B, and B is not ruled out of the word.
    const { absent, exactCounts } = deriveConstraints([guess("babes", "bbgbb")], 5);
    expect(absent).toEqual(new Set(["a", "e", "s"]));
    expect(exactCounts.get("b")).toBe(1);
  });

  it("tracks the minimum count of a repeated letter", () => {
    const { minCounts } = deriveConstraints([guess("eerie", "ygbby")], 5);
    expect(minCounts.get("e")).toBe(3);
  });
});

describe("keyboardState", () => {
  it("keeps the best state seen for each letter", () => {
    const state = keyboardState([guess("eerie", "byybb"), guess("rebel", "yggbb")]);
    expect(state.get("e")).toBe("green");
    expect(state.get("r")).toBe("yellow");
    expect(state.get("l")).toBe("gray");
  });
});

describe("rankGuesses", () => {
  it("prefers the guess that splits the candidates most evenly", () => {
    const candidates = ["batch", "catch", "hatch", "latch", "match", "patch", "watch"];
    const [best] = rankGuesses(candidates, 5, 1);
    expect(candidates).toContain(best.word);
    expect(best.expected).toBeLessThan(candidates.length);
  });

  it("returns nothing when there is nothing left", () => {
    expect(rankGuesses([], 5)).toEqual([]);
  });

  it("returns the single answer when one remains", () => {
    expect(rankGuesses(["crane"], 5)).toEqual([{ word: "crane", expected: 1 }]);
  });
});

describe("scorePartialGuess", () => {
  it("agrees with scoreGuess once every position is filled", () => {
    const pairs: [string, string][] = [
      ["crane", "nacre"],
      ["babes", "abbey"],
      ["eerie", "rebel"],
      ["geese", "abhor"],
      ["stare", "stare"],
    ];

    for (const [word, answer] of pairs) {
      expect(partialKey(scorePartialGuess([...word], answer))).toBe(patternKey(scoreGuess(word, answer)));
    }
  });

  it("leaves unfilled positions unscored", () => {
    expect(partialKey(scorePartialGuess([..."cr..."].map((c) => (c === "." ? "" : c)), "crane"))).toBe("gg...");
  });

  it("still draws yellows from the letters under unfilled positions", () => {
    // The N of "nap" sits at position 3 of "crane", which has not been typed
    // yet — that letter is still in the pool, so the N colors yellow.
    const letters = ["n", "", "", "", ""];
    expect(partialKey(scorePartialGuess(letters, "crane"))).toBe("y....");
  });

  it("grays a letter the answer does not hold", () => {
    const letters = ["z", "", "", "", ""];
    expect(partialKey(scorePartialGuess(letters, "crane"))).toBe("b....");
  });

  it("leaves a green's leftovers in the pool for a yellow", () => {
    // "abbey" holds two Bs, at positions 1 and 2. The typed B at position 2 is
    // green and claims that one; the B still sitting at position 1 is what
    // colors the leading B yellow rather than gray.
    const letters = ["b", "", "b", "", ""];
    expect(partialKey(scorePartialGuess(letters, "abbey"))).toBe("y.g..");
  });

  it("grays a repeat the answer cannot cover", () => {
    // Both of "abbey"'s Bs are claimed by the greens at positions 1 and 2, so
    // the third B typed finds an empty pool.
    const letters = ["b", "b", "b", "", ""];
    expect(partialKey(scorePartialGuess(letters, "abbey"))).toBe("bgg..");
  });
});

describe("matchesPartialGuess", () => {
  it("keeps a word whose colors match the typed prefix", () => {
    expect(matchesPartialGuess("crane", draft("cr...", "ggbbb"))).toBe(true);
  });

  it("drops a word the typed prefix contradicts", () => {
    expect(matchesPartialGuess("crane", draft("cr...", "gybbb"))).toBe(false);
  });

  it("ignores the marks under unfilled positions", () => {
    // The trailing marks are whatever the board happens to show; only the
    // filled positions carry a claim.
    expect(matchesPartialGuess("crane", draft("c....", "ggggg"))).toBe(true);
  });

  it("rejects a word of the wrong length", () => {
    expect(matchesPartialGuess("cranks", draft("cr...", "ggbbb"))).toBe(false);
  });

  it("agrees with matchesGuess on a complete row", () => {
    const words = ["crane", "nacre", "rebel", "abbey", "stare"];
    for (const word of words) {
      expect(matchesPartialGuess(word, draft("crane", "yyyyg"))).toBe(
        matchesGuess(word, guess("crane", "yyyyg")),
      );
    }
  });
});

describe("filterByPartial", () => {
  const words = ["crane", "crank", "crate", "nacre", "abbey"];

  it("narrows nothing when no letter has been typed", () => {
    expect(filterByPartial(words, draft(".....", "bbbbb"))).toEqual(words);
  });

  it("narrows to the words matching what has been typed so far", () => {
    // "cr" green at the front keeps every word starting "cr".
    expect(filterByPartial(words, draft("cr...", "ggbbb"))).toEqual(["crane", "crank", "crate"]);
  });

  it("narrows further as more letters land", () => {
    expect(filterByPartial(words, draft("cra..", "gggbb"))).toEqual(["crane", "crank", "crate"]);
    expect(filterByPartial(words, draft("cran.", "ggggb"))).toEqual(["crane", "crank"]);
  });

  it("treats an all-gray row as the miss it shows", () => {
    // Nothing is colored, so the board is claiming none of these letters are in
    // the word — only "abbey" has no C or R.
    expect(filterByPartial(words, draft("cr...", "bbbbb"))).toEqual(["abbey"]);
  });
});
