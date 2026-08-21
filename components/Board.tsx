"use client";

import type { Mark } from "@/lib/solver";

export interface BoardRow {
  letters: string[];
  marks: Mark[];
  locked: boolean;
}

const MARK_STYLES: Record<Mark, string> = {
  green: "bg-green border-green text-white",
  yellow: "bg-yellow border-yellow text-white",
  gray: "bg-gray border-gray text-white",
};

interface BoardProps {
  rows: BoardRow[];
  activeRow: number;
  length: number;
  onCycleMark: (row: number, tile: number) => void;
}

export default function Board({ rows, activeRow, length, onCycleMark }: BoardProps) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }}
      role="grid"
      aria-label="Guess board"
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          role="row"
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
        >
          {row.letters.map((letter, tileIndex) => {
            const filled = letter !== "";
            const isActiveRow = rowIndex === activeRow;
            const canToggle = filled && (row.locked || isActiveRow);

            return (
              <button
                key={tileIndex}
                type="button"
                role="gridcell"
                disabled={!canToggle}
                onClick={() => onCycleMark(rowIndex, tileIndex)}
                aria-label={
                  filled
                    ? `Row ${rowIndex + 1}, position ${tileIndex + 1}: ${letter.toUpperCase()}, ${row.marks[tileIndex]}. Click to change color.`
                    : `Row ${rowIndex + 1}, position ${tileIndex + 1}: empty`
                }
                className={[
                  "aspect-square w-full rounded-md border-2 text-center font-bold uppercase select-none",
                  "flex items-center justify-center transition-colors",
                  length > 7 ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl",
                  filled ? `${MARK_STYLES[row.marks[tileIndex]]} tile-pop` : "bg-tile text-ink",
                  filled ? "" : isActiveRow ? "border-tile-active" : "border-tile-border",
                  canToggle ? "cursor-pointer hover:brightness-110" : "cursor-default",
                  isActiveRow && !row.locked ? "" : "opacity-95",
                ].join(" ")}
              >
                {letter.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
