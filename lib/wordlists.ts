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
  /** One or more files, merged into a single list of unique words. */
  files: string[];
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

export const WORD_LISTS: WordListInfo[] = [
  {
    id: "common",
    name: "Common five-letter words",
    description:
      "Knuth's Stanford list plus every word the official answer list holds. The default — the answer list alone has been outgrown by the game.",
    lengths: [5],
    files: ["/wordlists/stanford.txt", "/wordlists/wordle-answers.txt"],
    sources: [STANFORD, CFRESHMAN],
  },
  {
    id: "wordle",
    name: "Original Wordle answers",
    description:
      "The 2,315 solutions Wordle shipped with. The tightest set, but the puzzle has since used words outside it.",
    lengths: [5],
    files: ["/wordlists/wordle-answers.txt"],
    sources: [CFRESHMAN],
  },
  {
    id: "scrabble",
    name: "Scrabble dictionary",
    description: "Every playable Scrabble word, 2 to 15 letters. Needed for word lengths other than five.",
    lengths: "any",
    files: ["/wordlists/scrabble.txt"],
    sources: [SCRABBLE],
  },
];

export const DEFAULT_LIST_ID = "common";

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

async function fetchWords(file: string): Promise<string[]> {
  const response = await fetch(file);
  if (!response.ok) throw new Error(`Could not load ${file} (${response.status})`);

  return response
    .text()
    .then((text) => text.split("\n").map((word) => word.trim().toLowerCase()).filter(Boolean));
}

/** Fetch a list once and keep it around for the rest of the session. */
export function loadWordList(id: string): Promise<string[]> {
  const list = getWordList(id);
  const cached = cache.get(list.id);
  if (cached) return cached;

  const pending = Promise.all(list.files.map(fetchWords))
    .then((files) => [...new Set(files.flat())].sort())
    .catch((cause: Error) => {
      // Don't cache a failure — a retry should be able to succeed.
      cache.delete(list.id);
      throw new Error(`Could not load ${list.name}. ${cause.message}`);
    });

  cache.set(list.id, pending);
  return pending;
}
