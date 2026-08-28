"use client";

import { useState } from "react";
import type { Suggestion } from "@/lib/solver";

const PAGE_SIZE = 300;

interface ResultsProps {
  candidates: string[];
  suggestions: Suggestion[];
  ranking: boolean;
  loading: boolean;
  error: string | null;
  /** Whether the board carries anything to filter by yet. */
  hasFeedback: boolean;
  listName: string;
  totalWords: number;
  onPick: (word: string) => void;
}

export default function Results({
  candidates,
  suggestions,
  ranking,
  loading,
  error,
  hasFeedback,
  listName,
  totalWords,
  onPick,
}: ResultsProps) {
  // Keyed to the candidate list so a new set of results starts collapsed
  // again without an effect resetting the count.
  const [expanded, setExpanded] = useState({ key: "", count: PAGE_SIZE });
  const key = `${candidates.length}:${candidates[0] ?? ""}:${candidates[candidates.length - 1] ?? ""}`;
  const visible = expanded.key === key ? expanded.count : PAGE_SIZE;

  const solved = candidates.length === 1;

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-edge bg-panel p-4 shadow-[var(--shadow)] sm:p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold">
          {loading
            ? "Loading words…"
            : error
              ? "Word list unavailable"
              : solved
                ? "That's the answer"
                : `${candidates.length.toLocaleString()} possible ${candidates.length === 1 ? "word" : "words"}`}
        </h2>
        <p className="text-sm text-muted">
          {listName} · {totalWords.toLocaleString()} words
        </p>
      </header>

      {error && <p className="mt-3 text-sm text-muted">{error}</p>}

      {!loading && !error && !hasFeedback && (
        <p className="mt-2 text-sm text-muted">
          Type a guess and color the tiles to match your game — the list narrows as you go.
        </p>
      )}

      {!loading && !error && hasFeedback && candidates.length === 0 && (
        <p className="mt-2 text-sm text-muted">
          Nothing in this list fits that feedback. Check the tile colors — or try a wider word list.
        </p>
      )}

      {solved && (
        <p className="mt-4 text-center font-bold tracking-[0.3em] text-green uppercase text-3xl sm:text-4xl">
          {candidates[0]}
        </p>
      )}

      {!loading && !error && candidates.length > 1 && (
        <>
          <div className="mt-4">
            <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Best next guess
              {ranking && <span className="ml-2 font-normal normal-case">working…</span>}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.word}
                  type="button"
                  onClick={() => onPick(suggestion.word)}
                  title={
                    Number.isNaN(suggestion.expected)
                      ? "Ranked by letter frequency"
                      : `Leaves about ${suggestion.expected.toFixed(1)} words on average`
                  }
                  className={[
                    "rounded-md border px-3 py-1.5 font-mono text-sm font-semibold uppercase transition-colors",
                    index === 0
                      ? "border-accent text-accent"
                      : "border-edge text-ink hover:border-accent hover:text-accent",
                  ].join(" ")}
                >
                  {suggestion.word}
                  {!Number.isNaN(suggestion.expected) && (
                    <span className="ml-2 font-sans text-xs font-normal text-muted normal-case">
                      ≈{suggestion.expected.toFixed(1)} left
                    </span>
                  )}
                </button>
              ))}
              {suggestions.length === 0 && !ranking && (
                <p className="text-sm text-muted">No suggestion yet.</p>
              )}
            </div>
          </div>

          <div className="mt-5 max-h-[55dvh] min-h-0 flex-1 overflow-y-auto lg:max-h-none">
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1.5">
              {candidates.slice(0, visible).map((word) => (
                <li key={word}>
                  <button
                    type="button"
                    onClick={() => onPick(word)}
                    className="w-full rounded-md border border-edge px-2 py-1.5 text-center font-mono text-sm uppercase transition-colors hover:border-accent hover:text-accent"
                  >
                    {word}
                  </button>
                </li>
              ))}
            </ul>

            {visible < candidates.length && (
              <button
                type="button"
                onClick={() => setExpanded({ key, count: visible + PAGE_SIZE })}
                className="mt-3 w-full rounded-md border border-edge py-2 text-sm text-muted hover:text-ink"
              >
                Show more ({(candidates.length - visible).toLocaleString()} hidden)
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
