import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// Plain JS on purpose: the script that writes the list and this test share one
// source of truth for the rule.
import { buildFromVendoredLists, isPluralForm } from "../scripts/build-common-list.mjs";

const read = (file: string) =>
  readFileSync(`public/wordlists/${file}`, "utf8").split("\n").filter(Boolean);

const stems = new Map<number, Set<string>>([
  [3, new Set(["ash", "box", "bus", "cry", "elf", "fly"])],
  [4, new Set(["back", "ache", "wife", "acre"])],
]);

describe("isPluralForm", () => {
  it.each(["backs", "aches", "acres", "ashes", "boxes", "buses", "flies", "cries", "elves", "wives"])(
    "treats %s as a plural",
    (word) => {
      expect(isPluralForm(word, stems)).toBe(true);
    },
  );

  it.each(["bliss", "chess", "abyss", "atlas", "bogus", "crane"])("keeps %s", (word) => {
    expect(isPluralForm(word, stems)).toBe(false);
  });
});

describe("the generated default list", () => {
  const committed = read("common.txt");

  it("matches what the generator produces", () => {
    expect(committed).toEqual(buildFromVendoredLists());
  });

  it("keeps every official answer, heuristic or not", () => {
    const answers = read("wordle-answers.txt");
    expect(answers.every((word) => committed.includes(word))).toBe(true);
    // These trip the plural heuristic but are real answers.
    for (const word of ["brass", "amiss", "amass", "abyss", "chaos"]) {
      expect(committed).toContain(word);
    }
  });

  it("adds the words the official list is missing", () => {
    expect(committed).toContain("aspic");
    expect(committed).toContain("those");
    expect(committed).toContain("atlas");
  });

  it("leaves out the plurals that made suggestions useless", () => {
    for (const word of ["backs", "aches", "shoes", "trees", "times", "flies", "elves", "boxes"]) {
      expect(committed).not.toContain(word);
    }
  });
});
