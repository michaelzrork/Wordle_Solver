import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bundleUrls, extractWords } from "../scripts/fetch-nyt-list.mjs";

describe("reading Wordle's word list out of the game", () => {
  it("collects the game's bundle URLs, without duplicates", () => {
    const html = `
      <script src="https://www.nytimes.com/games-assets/v2/8583.abc123.js"></script>
      <script src="https://www.nytimes.com/games-assets/v2/8583.abc123.js"></script>
      <link href="https://www.nytimes.com/games-assets/v2/wordle.def456.css">
      <script src="https://cdn.example.com/other.js"></script>
    `;
    expect(bundleUrls(html)).toEqual(["https://www.nytimes.com/games-assets/v2/8583.abc123.js"]);
  });

  it("takes the word array and ignores short string arrays around it", () => {
    const words = Array.from({ length: 1200 }, (_, i) =>
      `${String.fromCharCode(97 + (i % 26))}bcde`.slice(0, 5),
    );
    const source = `var a=["alpha","bravo"];const o=${JSON.stringify(words)};var b=["gamma"];`;
    expect(extractWords(source)).toEqual(words);
  });

  it("returns null for a bundle that carries no word list", () => {
    expect(extractWords('const a=["crane","slate","adieu"];')).toBeNull();
  });

  it("agrees with the list checked in", () => {
    // The vendored file is what extractWords produced, deduped and sorted.
    const words = readFileSync("public/wordlists/nyt.txt", "utf8").split("\n").filter(Boolean);
    expect(words.length).toBeGreaterThan(12000);
    expect(words.every((word) => /^[a-z]{5}$/.test(word))).toBe(true);
    expect([...words].sort()).toEqual(words);
    expect(new Set(words).size).toBe(words.length);
  });
});
