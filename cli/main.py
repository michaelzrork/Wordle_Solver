# -------------------------------
# Imports
# -------------------------------

from src.game import game_menu, set_defaults

# -------------------------------
# Start game
# -------------------------------

if __name__ == "__main__":
    print(f"\n{'*'*50}")
    print(f"Welcome to the Wordle Solver!")
    print(f"{'*'*50}")
    set_defaults()
    game_menu() 