"use client";

import { useEffect, useRef, useState } from "react";
import { rankGuesses, type Suggestion } from "./solver";
import type { RankRequest, RankResponse } from "./rank.worker";

interface RankedGuesses {
  key: string;
  suggestions: Suggestion[];
}

/**
 * Rank the next guess in a worker, falling back to the main thread if workers
 * aren't available. `key` identifies the candidate set, so a stale reply from
 * a superseded request is ignored.
 */
export function useSuggestions(
  candidates: string[],
  length: number,
  key: string,
  limit = 5,
): { suggestions: Suggestion[]; ranking: boolean } {
  const [ranked, setRanked] = useState<RankedGuesses>({ key: "", suggestions: [] });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof Worker === "undefined") return;

    const worker = new Worker(new URL("./rank.worker.ts", import.meta.url));
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (candidates.length <= 1) return;

    const worker = workerRef.current;
    if (worker) {
      const onMessage = (event: MessageEvent<RankResponse>) => {
        if (event.data.key !== key) return;
        setRanked({ key, suggestions: event.data.suggestions });
      };

      worker.addEventListener("message", onMessage);
      const request: RankRequest = { key, candidates, length, limit };
      worker.postMessage(request);

      return () => worker.removeEventListener("message", onMessage);
    }

    const handle = window.setTimeout(() => {
      setRanked({ key, suggestions: rankGuesses(candidates, length, limit) });
    }, 0);

    return () => window.clearTimeout(handle);
  }, [candidates, key, length, limit]);

  return {
    suggestions: ranked.key === key ? ranked.suggestions : [],
    ranking: candidates.length > 1 && ranked.key !== key,
  };
}
