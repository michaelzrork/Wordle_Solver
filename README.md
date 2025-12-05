# Wordle Solver

A Python command-line tool that identifies possible Wordle solutions based on game feedback.

## Description

This solver analyzes game state across up to 6 rounds, filtering word lists based on letter positions and states. Users input their guesses and the resulting feedback (green/yellow/gray), and the program returns all remaining valid solutions.

## Features

- **Multiple word lists**: Choose from Scrabble dictionary, Stanford word list, or cfreshman's Wordle answers (most restrictive, matches actual game solutions)
- **State-based filtering**: Handles green (correct position), yellow (wrong position), and gray (excluded) letters
- **Duplicate letter logic**: Correctly processes words where the same letter appears multiple times with different states
- **Edge case handling**: Improved tuple-based state tracking ensures accurate filtering when letters repeat

## What I Learned

- Constraint-based filtering systems
- Complex game state management
- Edge case detection and resolution (duplicate letters, position tracking)
- Efficient data structures (sets, lists, tuples)

## Usage

**Requirements**: Python 3.6+
```bash
# Navigate to download location
cd /path/to/download

# Run the solver
python Wordle_Solver.py
```

## Future Plans

- Refactor with constants for easy modification (word length, max rounds)
- Add GUI with Wordle-style grid interface
- Click-to-toggle letter states (green/yellow/gray)
- Display word list statistics and letter frequency analysis

## Development Notes

### Duplicate Letter Challenge

The trickiest part was handling cases where the same letter appears multiple times with different states (e.g., first 'E' is yellow, second 'E' is green). 

**Initial approach**: Tracked individual letter variables, but failed when yellow appeared before green in the guess.

**Solution**: Refactored to store complete guess state as tuples, evaluate all letters first, then check for duplicates. This ensures words like "EERIE" are correctly filtered when the game shows mixed states.

This edge case taught me the importance of state management order and led to the list/tuple-based architecture used throughout.