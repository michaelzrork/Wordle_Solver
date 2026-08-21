import { describe, expect, it } from "vitest";
import {
  deriveConstraints,
  filterWords,
  keyboardState,
  matchesGuess,
  patternKey,
  rankGuesses,
  scoreGuess,
  type Guess,
  type Mark,
} from "./solver";

const marks = (pattern: string): Mark[] =>
  [...pattern].map((c): Mark => (c === "g" ? "green" : c === "y" ? "yellow" : "gray"));

const guess = (word: string, pattern: string): Guess => ({ word, marks: marks(pattern) });

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
