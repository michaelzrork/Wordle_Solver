/** The answer lists the solver can search, mirroring the original CLI. */

export interface WordListInfo {
  id: string;
  name: string;
  description: string;
  /** Word lengths this list can serve, or "any" for a full dictionary. */
  lengths: number[] | "any";
  file: string;
  source: string;
}

export const WORD_LISTS: WordListInfo[] = [
  {
    id: "wordle",
    name: "Wordle answers",
    description: "The official solution list — the tightest set, and the one to use for the daily puzzle.",
    lengths: [5],
    file: "/wordlists/wordle-answers.txt",
    source: "https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b",
  },
  {
    id: "stanford",
    name: "Stanford five-letter words",
    description: "Knuth's list of common five-letter English words. Wider than the answer list.",
    lengths: [5],
    file: "/wordlists/stanford.txt",
    source: "https://www-cs-faculty.stanford.edu/~knuth/sgb-words.txt",
  },
  {
    id: "scrabble",
    name: "Scrabble dictionary",
    description: "Every playable Scrabble word, 2 to 15 letters. Needed for word lengths other than five.",
    lengths: "any",
    file: "/wordlists/scrabble.txt",
    source: "https://github.com/redbo/scrabble",
  },
];

export const DEFAULT_LIST_ID = "wordle";

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
        .filter((word) => word.length > 0),
    )
    .catch((error) => {
      // Don't cache a failure — a retry should be able to succeed.
      cache.delete(list.id);
      throw error;
    });

  cache.set(list.id, pending);
  return pending;
}
