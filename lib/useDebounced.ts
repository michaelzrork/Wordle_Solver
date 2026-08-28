"use client";

import { useEffect, useState } from "react";

/**
 * `value`, held back until it has stopped changing for `delay` ms.
 *
 * The candidate list is cheap enough to refilter on every keystroke, but
 * ranking the next guess is quadratic and the worker takes one message at a
 * time — posting a job per letter would leave the suggestions several letters
 * behind the board. Debouncing the input to the ranker keeps the list instant
 * and lets the suggestions land once typing pauses.
 */
export function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return settled;
}
