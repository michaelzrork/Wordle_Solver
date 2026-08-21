"use client";

import { WORD_LISTS, getWordList, listsForLength, supportsLength } from "@/lib/wordlists";

export interface GameSettings {
  listId: string;
  /** The list the player picked themselves, restored when it fits again. */
  preferredListId: string;
  length: number;
  rounds: number;
}

export const MIN_LENGTH = 2;
export const MAX_LENGTH = 12;
export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 10;

const LENGTHS = Array.from({ length: MAX_LENGTH - MIN_LENGTH + 1 }, (_, i) => MIN_LENGTH + i);
const ROUNDS = Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, i) => MIN_ROUNDS + i);

const SELECT_CLASS =
  "rounded-md border border-edge bg-bg px-3 py-2 text-ink focus:border-accent focus:outline-none";

interface SettingsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onClose: () => void;
}

export default function Settings({ settings, onChange, onClose }: SettingsProps) {
  const available = listsForLength(settings.length);

  const changeLength = (length: number) => {
    const preferred = getWordList(settings.preferredListId);
    // Five-letter lists can't serve other lengths, so fall back to one that
    // can — and come back to the player's own pick when it fits again.
    const listId = supportsLength(preferred, length)
      ? preferred.id
      : (listsForLength(length)[0]?.id ?? settings.listId);
    onChange({ ...settings, length, listId });
  };

  return (
    <div className="rounded-xl border border-edge bg-panel p-4 shadow-[var(--shadow)] sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-edge px-2.5 py-1 text-sm text-muted hover:text-ink"
        >
          Done
        </button>
      </div>

      <p className="mt-1 text-sm text-muted">
        Changing the word length starts a fresh board. Everything else keeps your guesses.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">Letters per word</span>
          <select
            value={settings.length}
            onChange={(event) => changeLength(Number(event.target.value))}
            className={SELECT_CLASS}
          >
            {LENGTHS.map((length) => (
              <option key={length} value={length}>
                {length} letters
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">Rounds</span>
          <select
            value={settings.rounds}
            onChange={(event) => onChange({ ...settings, rounds: Number(event.target.value) })}
            className={SELECT_CLASS}
          >
            {ROUNDS.map((rounds) => (
              <option key={rounds} value={rounds}>
                {rounds} {rounds === 1 ? "round" : "rounds"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-xs font-semibold tracking-wide text-muted uppercase">Answer list</legend>
        <div className="mt-2 flex flex-col gap-2">
          {WORD_LISTS.map((list) => {
            const usable = available.some((option) => option.id === list.id);
            return (
              <label
                key={list.id}
                className={[
                  "flex gap-3 rounded-lg border p-3 transition-colors",
                  settings.listId === list.id ? "border-accent" : "border-edge",
                  usable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="answer-list"
                  className="mt-1 accent-[var(--accent)]"
                  checked={settings.listId === list.id}
                  disabled={!usable}
                  onChange={() => onChange({ ...settings, listId: list.id, preferredListId: list.id })}
                />
                <span>
                  <span className="block text-sm font-semibold">{list.name}</span>
                  <span className="block text-sm text-muted">{list.description}</span>
                  {!usable && (
                    <span className="mt-1 block text-xs text-muted">
                      Five-letter words only.
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
