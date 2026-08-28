/** The answer lists the solver can search, mirroring the original CLI. */

export interface WordListSource {
  name: string;
  url: string;
}

export interface WordListInfo {
  id: string;
  name: string;
  description: string;
  /** Word lengths this list can serve, or "any" for a full dictionary. */
  lengths: number[] | "any";
  /**
   * How wide the list is, for offering a wider one when a search comes up
   * empty. Only the top of this ordering is load-bearing, and it holds in the
   * data: every five-letter word in the other three lists is a word Wordle
   * accepts, so widening to the game's own list can never lose a candidate.
   *
   * Below that the lists do not strictly nest — the Scrabble dictionary is the
   * bigger set but it has no ADMIN or INBOX, both of which are real answers the
   * likely-answers list carries — which is why only the widest is ever offered.
   */
  breadth: number;
  file: string;
  sources: WordListSource[];
}

const CFRESHMAN: WordListSource = {
  name: "Wordle answer list",
  url: "https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b",
};

const STANFORD: WordListSource = {
  name: "Knuth's SGB words",
  url: "https://www-cs-faculty.stanford.edu/~knuth/sgb-words.txt",
};

const SCRABBLE: WordListSource = {
  name: "redbo/scrabble",
  url: "https://github.com/redbo/scrabble",
};

const NYT: WordListSource = {
  name: "the Wordle game bundle",
  url: "https://www.nytimes.com/games/wordle",
};

export const WORD_LISTS: WordListInfo[] = [
  {
    id: "nyt",
    name: "Wordle's full dictionary",
    description:
      "Every word the game accepts as a guess, read out of Wordle's own code. The default — the only list that has never missed an answer, and it holds every word the others do.",
    lengths: [5],
    breadth: 4,
    file: "/wordlists/nyt.txt",
    sources: [NYT],
  },
  {
    id: "common",
    name: "Likely answers",
    description:
      "Every official answer plus Knuth's Stanford words, minus the plurals and proper names Wordle never uses. Narrows fastest, but has missed four answers since 2021 — MOMMY, LORIS, EMOJI, TWEEN.",
    lengths: [5],
    breadth: 2,
    file: "/wordlists/common.txt",
    sources: [STANFORD, CFRESHMAN],
  },
  {
    id: "wordle",
    name: "Original Wordle answers",
    description:
      "The 2,315 solutions Wordle shipped with. The tightest set, but the game now takes about one answer in eleven from outside it.",
    lengths: [5],
    breadth: 1,
    file: "/wordlists/wordle-answers.txt",
    sources: [CFRESHMAN],
  },
  {
    id: "scrabble",
    name: "Scrabble dictionary",
    description:
      "Every playable Scrabble word, 2 to 15 letters. The only list that covers word lengths other than five; at five letters Wordle's own list holds all of it and more.",
    lengths: "any",
    breadth: 3,
    file: "/wordlists/scrabble.txt",
    sources: [SCRABBLE],
  },
];

export const DEFAULT_LIST_ID = "nyt";

export function getWordList(id: string): WordListInfo {
  return WORD_LISTS.find((list) => list.id === id) ?? WORD_LISTS[0];
}

export function supportsLength(list: WordListInfo, length: number): boolean {
  return list.lengths === "any" || list.lengths.includes(length);
}

/** Lists that can answer for a given word length, best-first. */
export function listsForLength(length: number): WordListInfo[] {
  return WORD_LISTS.filter((list) => supportsLength(list, length));
}

/**
 * The widest list that can serve a word length.
 *
 * When a search comes up empty this is the only list worth offering. It is a
 * superset of every other list for that length, so it is the one switch that
 * can never lose a candidate the current list already had.
 */
export function widestListForLength(length: number): WordListInfo | null {
  return listsForLength(length).reduce<WordListInfo | null>(
    (widest, list) => (widest === null || list.breadth > widest.breadth ? list : widest),
    null,
  );
}

const cache = new Map<string, Promise<string[]>>();

/** Fetch a list once and keep it around for the rest of the session. */
export function loadWordList(id: string): Promise<string[]> {
  const list = getWordList(id);
  const cached = cache.get(list.id);
  if (cached) return cached;

  const pending = fetch(list.file)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load ${list.name} (${response.status})`);
      return response.text();
    })
    .then((text) =>
      text
        .split("\n")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean),
    )
    .catch((cause: Error) => {
      // Don't cache a failure — a retry should be able to succeed.
      cache.delete(list.id);
      throw cause;
    });

  cache.set(list.id, pending);
  return pending;
}
