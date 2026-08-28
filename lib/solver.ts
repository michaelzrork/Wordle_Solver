/**
 * Wordle solving logic.
 *
 * The original Python version accumulated constraints (greens, yellows,
 * excluded letters, doubled letters) as the game progressed. This port keeps
 * the same idea but derives everything from the source of truth: a guess is
 * consistent with a candidate answer exactly when scoring the guess against
 * that candidate reproduces the colors the game showed. That collapses every
 * duplicate-letter edge case into one rule.
 */

export type Mark = "gray" | "yellow" | "green";

export interface Guess {
  word: string;
  marks: Mark[];
}

/**
 * Color a guess the way Wordle would, given the answer.
 *
 * Greens are claimed first, then yellows consume whatever letters are left
 * over, so a guess of "eerie" against "rebel" marks only the first "e" yellow.
 */
export function scoreGuess(guess: string, answer: string): Mark[] {
  const length = guess.length;
  const marks: Mark[] = new Array(length).fill("gray");
  const remaining = new Map<string, number>();

  for (let i = 0; i < length; i++) {
    if (guess[i] === answer[i]) {
      marks[i] = "green";
    } else {
      remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
    }
  }

  for (let i = 0; i < length; i++) {
    if (marks[i] === "green") continue;
    const left = remaining.get(guess[i]) ?? 0;
    if (left > 0) {
      marks[i] = "yellow";
      remaining.set(guess[i], left - 1);
    }
  }

  return marks;
}

/** A compact string form of a mark pattern, used to bucket candidates. */
export function patternKey(marks: Mark[]): string {
  let key = "";
  for (const mark of marks) {
    key += mark === "green" ? "g" : mark === "yellow" ? "y" : "b";
  }
  return key;
}

/** True when `candidate` could still be the answer given a single guess. */
export function matchesGuess(candidate: string, guess: Guess): boolean {
  if (candidate.length !== guess.word.length) return false;
  const marks = scoreGuess(guess.word, candidate);
  for (let i = 0; i < marks.length; i++) {
    if (marks[i] !== guess.marks[i]) return false;
  }
  return true;
}

/** Every word that is still consistent with all of the feedback so far. */
export function filterWords(words: string[], guesses: Guess[]): string[] {
  if (guesses.length === 0) return words.slice();
  return words.filter((word) => guesses.every((guess) => matchesGuess(word, guess)));
}

/** A row still being typed. Positions with no letter yet hold "". */
export interface PartialGuess {
  letters: string[];
  marks: Mark[];
}

/**
 * Color a partly typed guess against an answer.
 *
 * Empty positions score as null and take no part in the marking, but the
 * answer letters underneath them stay in the pool the yellows draw from — so
 * once every position is filled this agrees with `scoreGuess` exactly, and a
 * row keeps its colors as the last letters land.
 */
export function scorePartialGuess(letters: string[], answer: string): (Mark | null)[] {
  const length = letters.length;
  const marks: (Mark | null)[] = new Array(length).fill(null);
  const remaining = new Map<string, number>();

  for (let i = 0; i < length; i++) {
    if (letters[i] !== "" && letters[i] === answer[i]) {
      marks[i] = "green";
    } else {
      remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
    }
  }

  for (let i = 0; i < length; i++) {
    if (letters[i] === "" || marks[i] === "green") continue;
    const left = remaining.get(letters[i]) ?? 0;
    if (left > 0) {
      marks[i] = "yellow";
      remaining.set(letters[i], left - 1);
    } else {
      marks[i] = "gray";
    }
  }

  return marks;
}

/** True when `candidate` could still be the answer given a partly typed row. */
export function matchesPartialGuess(candidate: string, draft: PartialGuess): boolean {
  if (candidate.length !== draft.letters.length) return false;
  const marks = scorePartialGuess(draft.letters, candidate);
  for (let i = 0; i < marks.length; i++) {
    if (marks[i] !== null && marks[i] !== draft.marks[i]) return false;
  }
  return true;
}

/**
 * Narrow `words` by the row being typed, so the list tracks the board without
 * waiting for the row to be submitted. An untouched row narrows nothing.
 */
export function filterByPartial(words: string[], draft: PartialGuess): string[] {
  if (draft.letters.every((letter) => letter === "")) return words;
  return words.filter((word) => matchesPartialGuess(word, draft));
}

export interface Constraints {
  /** Letter known to sit at each position, or "" when unknown. */
  greens: string[];
  /** Letters known to be in the word but not at this position. */
  notAt: Set<string>[];
  /** Letters ruled out of the word entirely. */
  absent: Set<string>;
  /** Minimum number of times a letter appears. */
  minCounts: Map<string, number>;
  /** Exact number of times a letter appears, when it is known. */
  exactCounts: Map<string, number>;
}

/** Roll the feedback up into the human-readable facts the UI displays. */
export function deriveConstraints(guesses: Guess[], length: number): Constraints {
  const greens: string[] = new Array(length).fill("");
  const notAt: Set<string>[] = Array.from({ length }, () => new Set<string>());
  const absent = new Set<string>();
  const minCounts = new Map<string, number>();
  const exactCounts = new Map<string, number>();

  for (const guess of guesses) {
    const seen = new Map<string, number>();
    const capped = new Set<string>();

    for (let i = 0; i < guess.word.length && i < length; i++) {
      const letter = guess.word[i];
      const mark = guess.marks[i];

      if (mark === "green") {
        greens[i] = letter;
        seen.set(letter, (seen.get(letter) ?? 0) + 1);
      } else if (mark === "yellow") {
        notAt[i].add(letter);
        seen.set(letter, (seen.get(letter) ?? 0) + 1);
      } else {
        notAt[i].add(letter);
        // A gray tile only means "no more of this letter than I have already
        // seen coloured in this guess" — which is zero for a plain miss.
        capped.add(letter);
      }
    }

    for (const [letter, count] of seen) {
      minCounts.set(letter, Math.max(minCounts.get(letter) ?? 0, count));
    }
    for (const letter of capped) {
      const count = seen.get(letter) ?? 0;
      exactCounts.set(letter, Math.min(exactCounts.get(letter) ?? count, count));
      if (count === 0) absent.add(letter);
    }
  }

  // A letter pinned green everywhere it can go is no longer "not at" anywhere.
  for (let i = 0; i < length; i++) {
    if (greens[i]) notAt[i].clear();
  }

  return { greens, notAt, absent, minCounts, exactCounts };
}

/** Best state seen for each letter, for coloring the on-screen keyboard. */
export function keyboardState(guesses: Guess[]): Map<string, Mark> {
  const rank: Record<Mark, number> = { gray: 0, yellow: 1, green: 2 };
  const state = new Map<string, Mark>();

  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      const letter = guess.word[i];
      const mark = guess.marks[i];
      const current = state.get(letter);
      if (current === undefined || rank[mark] > rank[current]) {
        state.set(letter, mark);
      }
    }
  }

  return state;
}

export interface Suggestion {
  word: string;
  /** Average number of candidates left if this word is played next. */
  expected: number;
}

/**
 * How many candidates would survive, on average, after playing `guess`.
 *
 * Every possible answer is bucketed by the pattern it would produce; a guess
 * that splits the candidates into many small buckets leaves less to sift.
 */
export function expectedRemaining(guess: string, candidates: string[]): number {
  const buckets = new Map<string, number>();
  for (const candidate of candidates) {
    const key = patternKey(scoreGuess(guess, candidate));
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  let total = 0;
  for (const size of buckets.values()) {
    total += size * size;
  }
  return total / candidates.length;
}

/** Positional letter frequency, used to rank when the candidate set is huge. */
function frequencyScore(candidates: string[], length: number): (word: string) => number {
  const counts: Map<string, number>[] = Array.from({ length }, () => new Map<string, number>());
  for (const word of candidates) {
    for (let i = 0; i < length; i++) {
      counts[i].set(word[i], (counts[i].get(word[i]) ?? 0) + 1);
    }
  }

  return (word: string) => {
    let score = 0;
    const used = new Set<string>();
    for (let i = 0; i < length; i++) {
      // Only credit a letter once so repeats don't beat broader coverage.
      if (used.has(word[i])) continue;
      used.add(word[i]);
      score += counts[i].get(word[i]) ?? 0;
    }
    return score;
  };
}

/**
 * Rank `guesses` by how many of `answers` would survive each one.
 *
 * Written flat because it is quadratic: the words are packed into byte arrays
 * up front and each pattern is folded into a base-3 integer, so the inner loop
 * allocates nothing. `scale` corrects the result when `answers` is a sample of
 * a larger candidate set — bucket sizes grow with the set, so the average
 * grows with it too.
 */
function rankByExpectation(
  guesses: string[],
  answers: string[],
  length: number,
  limit: number,
  scale: number,
): Suggestion[] {
  const encode = (words: string[]) => {
    const codes = new Uint8Array(words.length * length);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let k = 0; k < length; k++) {
        codes[i * length + k] = (word.charCodeAt(k) - 97) & 31;
      }
    }
    return codes;
  };

  const guessCodes = encode(guesses);
  const answerCodes = encode(answers);
  const answerCount = answers.length;

  const buckets = new Int32Array(3 ** length);
  const touchedKeys = new Int32Array(answerCount);
  const letterCounts = new Int32Array(32);
  const touchedLetters = new Int32Array(length);
  const isGreen = new Uint8Array(length);
  const scored: Suggestion[] = [];

  for (let g = 0; g < guesses.length; g++) {
    const guessAt = g * length;
    let touched = 0;
    let total = 0;

    for (let a = 0; a < answerCount; a++) {
      const answerAt = a * length;
      let letters = 0;
      let key = 0;

      // Greens first; every other answer letter goes into the pool that
      // yellows draw from.
      for (let k = 0; k < length; k++) {
        const answerLetter = answerCodes[answerAt + k];
        if (guessCodes[guessAt + k] === answerLetter) {
          isGreen[k] = 1;
        } else {
          isGreen[k] = 0;
          if (letterCounts[answerLetter] === 0) touchedLetters[letters++] = answerLetter;
          letterCounts[answerLetter]++;
        }
      }

      let place = 1;
      for (let k = 0; k < length; k++) {
        let mark = 0;
        if (isGreen[k] === 1) {
          mark = 2;
        } else {
          const guessLetter = guessCodes[guessAt + k];
          if (letterCounts[guessLetter] > 0) {
            mark = 1;
            letterCounts[guessLetter]--;
          }
        }
        key += mark * place;
        place *= 3;
      }

      for (let i = 0; i < letters; i++) letterCounts[touchedLetters[i]] = 0;

      if (buckets[key] === 0) touchedKeys[touched++] = key;
      buckets[key]++;
    }

    for (let i = 0; i < touched; i++) {
      const size = buckets[touchedKeys[i]];
      total += size * size;
      buckets[touchedKeys[i]] = 0;
    }

    scored.push({ word: guesses[g], expected: (total / answerCount) * scale });
  }

  return scored
    .sort((a, b) => a.expected - b.expected || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/** Take at most `max` words, spread evenly across the list. */
function sample(words: string[], max: number): string[] {
  if (words.length <= max) return words;

  const taken: string[] = [];
  for (let i = 0; i < max; i++) {
    taken.push(words[Math.floor((i * words.length) / max)]);
  }
  return taken;
}

/** Guesses worth playing next, best first. */
export function rankGuesses(candidates: string[], length: number, limit = 5): Suggestion[] {
  if (candidates.length === 0) return [];
  if (candidates.length <= 2) {
    return candidates.slice(0, limit).map((word) => ({ word, expected: 1 }));
  }

  // Above this word length the base-3 pattern table gets impractically large.
  if (length > MAX_EXACT_LENGTH) {
    const score = frequencyScore(candidates, length);
    return candidates
      .map((word) => ({ word, score: score(word) }))
      .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
      .slice(0, limit)
      .map(({ word }) => ({ word, expected: Number.NaN }));
  }

  if (candidates.length <= EXACT_RANKING_LIMIT) {
    return rankByExpectation(candidates, candidates, length, limit, 1);
  }

  // Past that the full calculation is too slow even in a worker, so each guess
  // is measured against an evenly spread sample of the candidates. The ranking
  // holds up; only the last digit of the estimate moves.
  const answers = sample(candidates, ANSWER_SAMPLE);
  return rankByExpectation(
    sample(candidates, GUESS_SAMPLE),
    answers,
    length,
    limit,
    candidates.length / answers.length,
  );
}

/** Below this many candidates, every guess is measured against every answer. */
export const EXACT_RANKING_LIMIT = 1500;

/** Answers to sample past that, and guesses to consider. */
const ANSWER_SAMPLE = 1500;
const GUESS_SAMPLE = 12000;

/** Above this word length the base-3 pattern table gets impractically large. */
const MAX_EXACT_LENGTH = 10;
