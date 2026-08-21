/// <reference lib="webworker" />

import { rankGuesses, type Suggestion } from "./solver";

export interface RankRequest {
  key: string;
  candidates: string[];
  length: number;
  limit: number;
}

export interface RankResponse {
  key: string;
  suggestions: Suggestion[];
}

// Ranking is quadratic in the number of candidates, so it runs here instead of
// on the main thread, where it would stall typing.
self.addEventListener("message", (event: MessageEvent<RankRequest>) => {
  const { key, candidates, length, limit } = event.data;
  const response: RankResponse = { key, suggestions: rankGuesses(candidates, length, limit) };
  self.postMessage(response);
});
