"use client";

import type { Mark } from "@/lib/solver";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const MARK_STYLES: Record<Mark, string> = {
  green: "bg-green text-white",
  yellow: "bg-yellow text-white",
  gray: "bg-gray text-white opacity-70",
};

interface KeyboardProps {
  states: Map<string, Mark>;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  canSubmit: boolean;
}

export default function Keyboard({ states, onLetter, onEnter, onBackspace, canSubmit }: KeyboardProps) {
  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label="Letter keyboard">
      {ROWS.map((row, index) => (
        <div key={row} className="flex justify-center gap-1 sm:gap-1.5">
          {index === 2 && (
            <button
              type="button"
              onClick={onEnter}
              disabled={!canSubmit}
              className="flex-[1.6] rounded-md bg-key px-1 py-3 text-xs font-bold text-key-ink uppercase disabled:opacity-40 sm:text-sm"
            >
              Enter
            </button>
          )}
          {[...row].map((letter) => {
            const state = states.get(letter);
            return (
              <button
                key={letter}
                type="button"
                onClick={() => onLetter(letter)}
                aria-label={state ? `${letter.toUpperCase()}, ${state}` : letter.toUpperCase()}
                className={[
                  "min-w-0 flex-1 rounded-md py-3 text-sm font-bold uppercase transition-colors sm:text-base",
                  state ? MARK_STYLES[state] : "bg-key text-key-ink",
                  "hover:brightness-110 active:brightness-95",
                ].join(" ")}
              >
                {letter}
              </button>
            );
          })}
          {index === 2 && (
            <button
              type="button"
              onClick={onBackspace}
              aria-label="Backspace"
              className="flex-[1.6] rounded-md bg-key px-1 py-3 text-xs font-bold text-key-ink uppercase sm:text-sm"
            >
              Del
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
