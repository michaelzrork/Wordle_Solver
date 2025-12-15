######### Game Utilities #########

# -------------------------------
# Quit Game
# -------------------------------

def quit_game():
    quit_choice = input(f"Are you sure you want to exit the program? (y/n): ").strip().lower()
    if quit_choice == 'y':
        print(f"Exiting the program. Goodbye!")
        exit()
    else:
        return