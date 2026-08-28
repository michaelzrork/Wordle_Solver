"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Board, { type BoardRow } from "@/components/Board";
import Keyboard from "@/components/Keyboard";
import Results from "@/components/Results";
import Settings, { type GameSettings } from "@/components/Settings";
import {
  deriveConstraints,
  filterByPartial,
  filterWords,
  keyboardState,
  patternKey,
  type Guess,
  type Mark,
} from "@/lib/solver";
import { useDebounced } from "@/lib/useDebounced";
import { useSuggestions } from "@/lib/useSuggestions";
import { DEFAULT_LIST_ID, getWordList, loadWordList, widestListForLength } from "@/lib/wordlists";

const MARK_CYCLE: Mark[] = ["gray", "yellow", "green"];

/** How long typing has to settle before the next-guess ranking re-runs. */
const RANK_SETTLE_MS = 200;

const DEFAULT_SETTINGS: GameSettings = {
  listId: DEFAULT_LIST_ID,
  preferredListId: DEFAULT_LIST_ID,
  length: 5,
  rounds: 6,
};

/** The row being typed: letters plus the colors the game gave them. */
interface Draft {
  letters: string[];
  marks: Mark[];
}

function emptyDraft(length: number): Draft {
  return { letters: Array(length).fill(""), marks: Array(length).fill("gray") };
}

/** A word list, tagged with the settings it was loaded for. */
interface LoadedList {
  key: string;
  words: string[];
  error: string | null;
}

const NO_WORDS: string[] = [];

export default function Home() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const [loaded, setLoaded] = useState<LoadedList>({ key: "", words: [], error: null });

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(DEFAULT_SETTINGS.length));

  const list = getWordList(settings.listId);
  const listKey = `${settings.listId}:${settings.length}`;

  // Load the chosen list and keep only the words of the right length.
  useEffect(() => {
    let cancelled = false;

    loadWordList(settings.listId)
      .then((all) => {
        if (cancelled) return;
        setLoaded({ key: listKey, words: all.filter((word) => word.length === settings.length), error: null });
      })
      .catch((cause: Error) => {
        if (cancelled) return;
        setLoaded({ key: listKey, words: [], error: cause.message });
      });

    return () => {
      cancelled = true;
    };
  }, [settings.listId, settings.length, listKey]);

  // Until the fetch for the current settings lands, treat the list as loading.
  const ready = loaded.key === listKey;
  const words = ready ? loaded.words : NO_WORDS;
  const error = ready ? loaded.error : null;
  const loading = !ready;

  // Only a new word length invalidates what is on the board; a different list
  // or round count leaves the guesses standing.
  const applySettings = useCallback(
    (next: GameSettings) => {
      setSettings(next);

      if (next.length !== settings.length) {
        setGuesses([]);
        setDraft(emptyDraft(next.length));
      } else {
        setGuesses((current) => current.slice(0, next.rounds));
      }
    },
    [settings.length],
  );

  const submitted = useMemo(() => filterWords(words, guesses), [words, guesses]);

  // The row being typed narrows the list as it goes, so what is on the board is
  // always what has been filtered and Enter only locks the row in.
  const candidates = useMemo(() => filterByPartial(submitted, draft), [submitted, draft]);

  // Constraints and key colors stay on submitted rows only. Feeding the draft
  // into `markFor` would let a tile colored green pre-color the next letter
  // typed, which then feeds back into the draft it came from.
  const constraints = useMemo(
    () => deriveConstraints(guesses, settings.length),
    [guesses, settings.length],
  );
  const keyStates = useMemo(() => keyboardState(guesses), [guesses]);

  // Ranking is far too slow to redo per keystroke, so it follows the draft only
  // once typing settles. A length change resets the draft, and the old one is
  // still settling, so fall back to the live draft until the two agree.
  const settling = useDebounced(draft, RANK_SETTLE_MS);
  const settledDraft = settling.letters.length === settings.length ? settling : draft;

  const rankCandidates = useMemo(
    () => filterByPartial(submitted, settledDraft),
    [submitted, settledDraft],
  );

  // Suggestions are computed off the main thread, keyed to the board state that
  // produced this candidate set.
  const rankKey = useMemo(
    () =>
      `${listKey}|${guesses.map((guess) => `${guess.word}${patternKey(guess.marks)}`).join(",")}` +
      `|${settledDraft.letters.join("")}${patternKey(settledDraft.marks)}`,
    [listKey, guesses, settledDraft],
  );
  const { suggestions, ranking } = useSuggestions(rankCandidates, settings.length, rankKey);

  // Nothing fitting the feedback is usually a miscolored tile, but it can also
  // be a word this list has never carried. The lists nest, so only the widest
  // one for this length is worth offering — anything else would come up empty
  // too. Offered as a button rather than switched automatically: a silent
  // change of list would look like the solver had simply changed its mind.
  const widest = widestListForLength(settings.length);
  const widerList = widest && widest.id !== settings.listId ? widest : null;

  const widen = useCallback(() => {
    if (!widerList) return;
    applySettings({ ...settings, listId: widerList.id, preferredListId: widerList.id });
  }, [applySettings, settings, widerList]);

  const boardFull = guesses.length >= settings.rounds;
  const draftFilled = draft.letters.every((letter) => letter !== "");
  const draftEmpty = draft.letters.every((letter) => letter === "");

  const markFor = useCallback(
    (letter: string, index: number): Mark =>
      constraints.greens[index] === letter ? "green" : "gray",
    [constraints],
  );

  const typeLetter = useCallback(
    (letter: string) => {
      if (boardFull) return;

      // Functional updates keep fast typing intact: each keystroke sees the
      // letters the one before it wrote, even within a single render.
      setDraft((current) => {
        const next = current.letters.indexOf("");
        if (next === -1) return current;

        const letters = [...current.letters];
        const marks = [...current.marks];
        letters[next] = letter;
        // Positions already solved are pre-colored, so they need no click.
        marks[next] = markFor(letter, next);
        return { letters, marks };
      });
    },
    [boardFull, markFor],
  );

  const backspace = useCallback(() => {
    setDraft((current) => {
      const filled = current.letters.filter((letter) => letter !== "").length;
      if (filled === 0) return current;

      const letters = [...current.letters];
      const marks = [...current.marks];
      letters[filled - 1] = "";
      marks[filled - 1] = "gray";
      return { letters, marks };
    });
  }, []);

  const submit = useCallback(() => {
    if (boardFull || !draftFilled) return;
    setGuesses((current) => [...current, { word: draft.letters.join(""), marks: [...draft.marks] }]);
    setDraft(emptyDraft(settings.length));
  }, [boardFull, draftFilled, draft, settings.length]);

  const undo = useCallback(() => {
    setGuesses((current) => current.slice(0, -1));
    setDraft(emptyDraft(settings.length));
  }, [settings.length]);

  const reset = useCallback(() => {
    setGuesses([]);
    setDraft(emptyDraft(settings.length));
  }, [settings.length]);

  const cycleMark = useCallback(
    (row: number, tile: number) => {
      const step = (mark: Mark) => MARK_CYCLE[(MARK_CYCLE.indexOf(mark) + 1) % MARK_CYCLE.length];

      if (row < guesses.length) {
        // Editing a submitted row re-runs the filter with the corrected colors.
        setGuesses((current) =>
          current.map((guess, index) =>
            index === row
              ? { ...guess, marks: guess.marks.map((mark, i) => (i === tile ? step(mark) : mark)) }
              : guess,
          ),
        );
        return;
      }

      setDraft((current) => ({
        ...current,
        marks: current.marks.map((mark, i) => (i === tile ? step(mark) : mark)),
      }));
    },
    [guesses.length],
  );

  const fillDraft = useCallback(
    (word: string) => {
      if (boardFull) return;
      const letters = [...word];
      setDraft({ letters, marks: letters.map((letter, index) => markFor(letter, index)) });
    },
    [boardFull, markFor],
  );

  // Physical keyboard drives the board the same way the on-screen one does.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.key === "Enter") {
        event.preventDefault();
        submit();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        typeLetter(event.key.toLowerCase());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submit, backspace, typeLetter]);

  const rows: BoardRow[] = useMemo(() => {
    const built: BoardRow[] = guesses.map((guess) => ({
      letters: [...guess.word],
      marks: guess.marks,
      locked: true,
    }));

    if (built.length < settings.rounds) {
      built.push({ letters: draft.letters, marks: draft.marks, locked: false });
    }

    while (built.length < settings.rounds) {
      built.push({
        letters: Array(settings.length).fill(""),
        marks: Array(settings.length).fill("gray"),
        locked: false,
      });
    }

    return built;
  }, [guesses, draft, settings.rounds, settings.length]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wordle Solver</h1>
          <p className="text-sm text-muted">
            Enter a guess, color the tiles, and see every word that still fits.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={guesses.length === 0}
            className="rounded-md border border-edge px-3 py-1.5 text-sm hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-ink"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={guesses.length === 0 && draftEmpty}
            className="rounded-md border border-edge px-3 py-1.5 text-sm hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-ink"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((open) => !open)}
            aria-expanded={showSettings}
            className="rounded-md border border-edge px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
          >
            Settings
          </button>
        </div>
      </header>

      {showSettings && (
        <Settings
          settings={settings}
          onChange={applySettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="mx-auto w-full max-w-[22rem]">
            <Board
              rows={rows}
              activeRow={Math.min(guesses.length, settings.rounds - 1)}
              length={settings.length}
              onCycleMark={cycleMark}
            />
          </div>

          <p className="text-center text-xs text-muted">
            Click a tile to cycle it gray → yellow → green.
            {boardFull
              ? ` All ${settings.rounds} ${settings.rounds === 1 ? "round" : "rounds"} used — undo or reset to keep going.`
              : draftFilled
                ? " Press Enter to keep this row and start the next."
                : ""}
          </p>

          <Keyboard
            states={keyStates}
            onLetter={typeLetter}
            onEnter={submit}
            onBackspace={backspace}
            canSubmit={draftFilled && !boardFull}
          />
        </div>

        <div className="flex min-h-0 flex-col lg:max-h-[calc(100dvh-8rem)]">
          <Results
            candidates={candidates}
            suggestions={suggestions}
            ranking={ranking}
            loading={loading}
            error={error}
            hasFeedback={guesses.length > 0 || !draftEmpty}
            listName={list.name}
            totalWords={words.length}
            widerListName={widerList?.name ?? null}
            onWiden={widen}
            onPick={fillDraft}
          />
        </div>
      </div>

      <footer className="border-t border-edge pt-4 text-xs text-muted">
        <p>
          Guesses are matched by replaying them against every word in the list, so repeated
          letters resolve exactly the way the game scores them. Suggestions rank by how few
          candidates each guess would leave behind. Words from{" "}
          {list.sources.map((source, index) => (
            <span key={source.url}>
              {index > 0 && " and "}
              <a className="underline hover:text-ink" href={source.url} rel="noreferrer" target="_blank">
                {source.name}
              </a>
            </span>
          ))}
          .{" "}
          <a
            className="underline hover:text-ink"
            href="https://github.com/michaelzrork/wordle_solver"
            rel="noreferrer"
            target="_blank"
          >
            Source on GitHub
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
