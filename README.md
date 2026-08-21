# Wordle Solver

A web app that narrows down the possible Wordle answers from the feedback the game
gives you. Type a guess, color the tiles the way Wordle colored them, and every word
that can still be the answer appears — along with the guess that would cut the list
down fastest.

Started life as a Python command-line tool (still in [`cli/`](cli/)); this repo now
also holds a TypeScript port with a Wordle-style front end, deployed on Vercel.

## Using it

1. Type a five-letter guess — physical keyboard or the on-screen one.
2. Click each tile to cycle it **gray → yellow → green** to match your game.
   Positions you have already solved are colored green automatically.
3. Press **Enter**. The remaining candidates appear on the right.
4. Click any word — a suggestion or a candidate — to load it into the next row.

Miscolored a tile? Click it again on a submitted row and the list re-filters. **Undo**
drops the last guess, **Reset** clears the board.

### Settings

- **Letters per word** — 2 to 12. Anything other than five switches to the Scrabble
  dictionary, the only list that carries other lengths.
- **Rounds** — 1 to 10.
- **Answer list** — likely answers (default), the original Wordle answers, or the full
  Scrabble dictionary.

## How the solving works

The Python version accumulated constraints as the game went on: green positions, letters
ruled out, letters known to be present, and a special case for doubled letters. Duplicate
letters were the hard part — a guess of `EERIE` against `REBEL` colors one E green, one
yellow, and one gray, and the rules for which is which are easy to get subtly wrong.

The port turns the question around. A candidate word survives a guess exactly when
*scoring that guess against the candidate reproduces the colors the game showed*:

```ts
matchesGuess(candidate, guess) === (scoreGuess(guess.word, candidate) === guess.marks)
```

`scoreGuess` is the game's own marking rule — greens claim their letters first, then
yellows draw from what is left. Every duplicate-letter case falls out of it for free,
and there is no separate bookkeeping to keep in sync.

### Best next guess

For each candidate, the solver buckets every possible answer by the pattern that guess
would produce, and reports the average bucket size — how many words you would still be
sifting after playing it. Lower is better, and the top five are shown.

That calculation is quadratic, so it runs in a Web Worker (`lib/rank.worker.ts`) with an
allocation-free inner loop: words packed into one byte array, patterns folded into base-3
integers. Around 10 million pairs a second, and the board never stalls.

Past 1,500 candidates even that is too slow, so each guess is measured against an evenly
spread sample of 1,500 candidates and the result scaled back up. On the full default list
that returns the same top guess as the exact calculation (RAISE), with the estimate
within 2% of the true value, in a twentieth of the time.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # solver + word list tests
npm run build    # production build
npm run lint
```

The original CLI still runs on its own, no dependencies beyond Python 3.10+:

```bash
python cli/main.py
```

## Deploying

The app is a static Next.js build with no server-side state, no environment variables,
and no database — the word lists ship in `public/wordlists/` and the solving happens in
the browser. Import the repo at [vercel.com/new](https://vercel.com/new) and accept the
detected defaults, or:

```bash
npx vercel deploy --prod
```

## Layout

```
app/                 Next.js app router — page, layout, styles
components/          Board, Keyboard, Results, Settings
lib/solver.ts        Scoring, filtering, ranking (no UI, fully tested)
lib/rank.worker.ts   Ranking off the main thread
lib/wordlists.ts     List metadata and loading
public/wordlists/    The word lists, including the generated default
scripts/             Word list generation
cli/                 The original Python command-line solver
```

## Word lists

| List | Words | Source |
| --- | --- | --- |
| Likely answers (default) | 4,133 | built from the two below |
| Original Wordle answers | 2,315 | [cfreshman gist](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b) |
| Stanford five-letter words | 5,757 | [Knuth's SGB word list](https://www-cs-faculty.stanford.edu/~knuth/sgb-words.txt) |
| Scrabble dictionary | 178,691 | [redbo/scrabble](https://github.com/redbo/scrabble) |

Neither source is an answer list on its own. Wordle has used solutions the shipped list
never held (ASPIC), Knuth's list is missing 33 words that have been answers (ADMIN,
LATTE, ANIME), and Knuth's is a *word* list — it carries ~1,600 plural and third-person
-S forms, which a Wordle answer is never allowed to be.

So the default is generated: every official answer, plus the Stanford words that are not
plural forms. Official answers are never filtered — they are known-good, and a few
("brass", "amiss") would trip the heuristic. Regenerate with:

```bash
npm run build:wordlist
```

`scripts/build-common-list.mjs` holds the rule, and the test suite re-runs it and
compares against the committed file, so the two cannot drift.

They are vendored rather than fetched at runtime, so the app has no external dependency
at request time and works offline once loaded.
