from src.utils import pause_prompt 
from src.game_utils import quit_game
from src import answer_lists
from src.solver import fetch_words

# -------------------------------
# Variables
# -------------------------------

num_rounds = 0
num_letters = 0
excluded_letters = set()
included_letters = set()
doubled_letters = set()
solved_positions = ['']
not_positions = []

# -------------------------------
# Set Defaults
# -------------------------------
   
def set_defaults():
    global num_rounds, num_letters
    num_rounds = 6
    num_letters = 5
    returned = answer_lists.get_words_from_url(answer_lists.answer_lists[2])  # Default to cfreshman Wordle Solutions list
    if returned:
        reset_game_state()
        print(f"\nDefault settings applied:\n- Number of Rounds: {num_rounds}\n- Number of Letters: {num_letters}\n- Selected Answers: {answer_lists.selected_answer_list[1]}")
    else:
        print(f"\nFailed to load the {answer_lists.answer_lists[2][1]} list.")
        pause_prompt()

        
# --------------------------------
# Reset game state
# --------------------------------

def reset_game_state():
    global excluded_letters
    global included_letters
    global doubled_letters
    global solved_positions
    global not_positions
    global num_letters
    doubled_letters = set()
    solved_positions = [''] * num_letters
    not_positions = [set() for _ in range(num_letters)]
    excluded_letters = set()
    included_letters = set()

# -------------------------------
# Number of Rounds
# -------------------------------

def set_num_rounds(n):
    global num_rounds
    num_rounds = input(f"\nEnter the number of rounds you want to play (default is 6): ").strip()
    if num_rounds.isdigit() and int(num_rounds) >= 1:
        num_rounds = int(num_rounds)
        print(f"You have selected to play {num_rounds} rounds.")
        pause_prompt()
    else:
        num_rounds = 6
        print(f"Invalid input. Defaulting to 6 rounds.")
        pause_prompt()
       
# -------------------------------
# Number of Letters
# -------------------------------

def set_num_letters(n):
    global num_letters
    num_letters = input(f"\nEnter the number of letters in the word (default is 5): ").strip()
            
    if num_letters.isdigit() and int(num_letters) >= 1:
        num_letters = int(num_letters)
        print(f"\nGame set to use {num_letters} letters.")
        if num_letters != 5:
            print(f"\nLoading {answer_lists.answer_lists[0][1]} to accommodate different word lengths.") 
            if answer_lists.get_words_from_url(answer_lists.answer_lists[0]):  # Load Scrabble list for different lengths          
                answer_lists.selected_answer_list = answer_lists.answer_lists[0]
                print(f"{answer_lists.selected_answer_list[1]} loaded successfully.")
            else:
                print(f"Failed to load {answer_lists.answer_lists[0][1]}. Reverting to 5 letters and default list.")
                num_letters = 5
                answer_lists.get_words_from_url(answer_lists.answer_lists[2])  # Revert to default cfreshman list
                answer_lists.selected_answer_list = answer_lists.answer_lists[2]
        
        pause_prompt()
    else:
        num_letters = 5
        print(f"Invalid input. Defaulting to 5 letters.")  
        pause_prompt()
        
# --------------------------------
# Game Menu
# --------------------------------

def game_menu():
    global num_rounds, num_letters
    while True:
        reset_game_state()
        print(f"\n{'='*50}")
        print(f"WORDLE SOLVER - GAME MENU")
        print(f"{'='*50}")
        print(f"\nSelect One:")
        print(f"1. Start Game")
        print(f"2. Set number of letters (current: {num_letters})")
        print(f"3. Set number of rounds (current: {num_rounds})")
        print(f"4. Select answer list (curerent: {answer_lists.selected_answer_list[1]})")
        print(f"5. Reset to defaults.")
        print(f"6. Exit")

        choice = input(f"\nEnter choice: ").strip()
        if choice == '1':
            print(f"\nStarting the game with {num_rounds} rounds and {num_letters} letters using the {answer_lists.selected_answer_list[1]}...\n")
            play_game()
        elif choice == '2':
            set_num_letters(num_letters)
        elif choice == '3':
            set_num_rounds(num_rounds)
        elif choice == '4':
            if num_letters != 5:
                print(f"\nAnswer list selection is disabled.\nSet the number of letters back to 5 to select a different answer list.")
                pause_prompt()
            else:
                answer_lists.pick_answer_list()
        elif choice == '5':
            set_defaults()
            pause_prompt()
        elif choice == '6' or choice == 'exit' or choice == 'quit' or choice == '':
            quit_game()
        elif choice == '7':
            print(f"\nCurrent word list ({len(answer_lists.words)} words):\n")
            print_list(0)
            pause_prompt()
        else:
            print(f"Invalid choice. Please select a number 1-6.")
            pause_prompt()

# -------------------------------
# Play Game
# -------------------------------

def play_game():
    global excluded_letters
    global included_letters
    global doubled_letters
    global solved_positions
    global not_positions
    global num_letters
    global num_rounds
    guess_history = []
   
    # -------------------------------
    # Game loop - up to n rounds
    # -------------------------------
    for round in range(num_rounds):
       
        print(f"\n{'='*20} ROUND {round+1} {'='*20}\n")
       
        while True:
            # -------------------------------
            # prompt user for guess
            # -------------------------------
            guess = input(f"Type in your guess: ").strip().lower()
            
            # -------------------------------
            # if blank guess, confirm and quit
            # -------------------------------
            if guess == '':
                confirm_quit = input(f"Would you like to go back to the game menu? (y/n): ").strip().lower()
                if confirm_quit == 'y':
                    return
                else:
                    continue
            
            # -------------------------------
            # Debugging print
            # -------------------------------
            
            if guess == 'd':
                print(f"DEBUG: Excluded Letters: {excluded_letters}")
                print(f"DEBUG: Included Letters: {included_letters}")
                print(f"DEBUG: Doubled Letters: {doubled_letters}")
                print(f"DEBUG: Solved Positions: {solved_positions}")
                print(f"DEBUG: Not Positions: {not_positions}")
                print(f"DEBUG: Guess History: {guess_history}")
                pause_prompt()
                continue
            
            # -------------------------------
            # if not word length, show error and re-prompt
            # -------------------------------
            elif guess != '' and len(guess) != num_letters:
                print(f"Error: Guess must be exactly {num_letters} letters long. Please try again.")
                continue
            # -------------------------------
            # if contains non-letters, show error and re-prompt
            # -------------------------------
            elif guess != '' and any(char not in 'abcdefghijklmnopqrstuvwxyz' for char in guess):
                print(f"Error: Guess must only contain letters A-Z. Please try again.")
                continue
            # -------------------------------
            # valid guess  
            # -------------------------------
            else:
                guess_history.append(guess)
                break
        
        # -------------------------------
        # initialize guess state
        # -------------------------------
        guess_state = [('', '')] * num_letters
        
        # -------------------------------
        # prompt user for letter states
        # -------------------------------
        print(f"\nEnter the state of each letter in your guess\n'g' for green, 'y' for yellow, 'b' for black/gray\n")
        for i in range(num_letters):
            # -------------------------------
            # if letter already confirmed green, skip
            # -------------------------------
            if solved_positions[i] != '' and guess[i] == solved_positions[i]:
                guess_state[i] = (guess[i], 'g') # this is unnecessary but keeps structure consistent
                print(f"Position {i+1} is '{guess[i].upper()}': CONFIRMED GREEN")
                continue
            
            # -------------------------------
            # prompt for letter state until valid input
            # -------------------------------
            while True:
                # -------------------------------
                # prompt user for letter state
                # -------------------------------
                state = input(f"Position {i+1} is '{guess[i].upper()}': ").strip().lower()
                
                # -------------------------------
                # if user wants to exit, confirm and quit
                # -------------------------------
                if state == '':
                    confirm_quit = input(f"Would you like to go back to the game menu? (y/n): ").strip().lower()
                    if confirm_quit == 'y':
                        return
                    else:
                        continue
                
                # -------------------------------
                # Debugging print
                # -------------------------------
                
                if state == 'd':
                    print(f"DEBUG: Excluded Letters: {excluded_letters}")
                    print(f"DEBUG: Included Letters: {included_letters}")
                    print(f"DEBUG: Doubled Letters: {doubled_letters}")
                    print(f"DEBUG: Solved Positions: {solved_positions}")
                    print(f"DEBUG: Not Positions: {not_positions}")
                    print(f"DEBUG: Guess History: {guess_history}")
                    print(f"DEBUG: Current Guess State: {guess_state}")
                    pause_prompt()
                    continue
                
                # -------------------------------
                # if black/gray, add to excluded letters
                # -------------------------------
                elif state == 'b':
                    # only add to excluded letters if not in included letters
                    if guess[i] in included_letters:
                        not_positions[i].add(guess[i])
                    else:
                        excluded_letters.add(guess[i])
                    break

                # -------------------------------
                # if green, set correct position    
                # -------------------------------
                elif state == 'g':
                    solved_positions[i] = guess[i]
                    # -------------------------------
                    # Add to included letters
                    # -------------------------------
                    included_letters.add(guess[i])
                    break

                # -------------------------------
                # if yellow, add to not position and included letters
                # -------------------------------
                elif state == 'y':
                    # -------------------------------
                    # Check for doubled letters from previous guesses
                    # -------------------------------
                    if guess[i] in solved_positions:
                        doubled_letters.add(guess[i])
                    # -------------------------------
                    # Add to not position
                    # -------------------------------
                    not_positions[i].add(guess[i])
                    # -------------------------------
                    # Add to included letters
                    # -------------------------------
                    included_letters.add(guess[i])
                    break
                
                # -------------------------------
                # invalid state entered
                # -------------------------------
                else:
                    print(f"Invalid state. Please enter 'g', 'y', or 'b'.")
                    continue
            
            # -------------------------------
            # Update guess state
            # -------------------------------
            guess_state[i] = (guess[i], state)
    
        # -------------------------------
        # Check for doubled letters in current guess
        # -------------------------------
        for letter, state in guess_state:
            if state == 'y' and guess.count(letter) > 1:
                if letter in solved_positions:
                    doubled_letters.add(letter)

        # -------------------------------
        # Print possible words
        # -------------------------------        
        print_list(round)
        
# -------------------------------
# Print list
# -------------------------------

def print_list(round):  
    global num_rounds
    global solved_positions
    global excluded_letters
    global included_letters
    global doubled_letters
    global not_positions
    global num_letters
    
    # -------------------------------
    # Fetch possible words  
    # -------------------------------
    
    word_list = fetch_words(excluded_letters, included_letters, doubled_letters, solved_positions, not_positions, answer_lists.words, num_letters)
   
    # -------------------------------
    # If word list is empty, show message and reset
    # -------------------------------
    if len(word_list) == 0:
        print(f"\nNo possible words found with the current constraints.\nGame aborted. Please check your inputs and try again.\n")
        pause_prompt()
        game_menu()
   
    # -------------------------------
    # If it is the last round and not solved, show message and reset
    # -------------------------------
    elif round == num_rounds - 1 and any(letter == '' for letter in solved_positions):
        print(f"\n{'='*50}")
        print(f"\nMaximum rounds reached. The possible words were:\n")
        for word in sorted(word_list):
            print(f"  {word.upper()}")
        pause_prompt()
        game_menu()
   
    # -------------------------------
    # If it is the last round and solved, congratulate and reset
    # -------------------------------
    elif round == num_rounds - 1 and all(letter != '' for letter in solved_positions):
        print(f"\n{'='*50}")
        print(f"CONGRATULATIONS! You've solved today's Wordle!")
        print(f"The word is: {word_list[0].upper()}")
        print(f"{'='*50}\n")
        pause_prompt()
        game_menu()
   
    # -------------------------------
    # If only one word found, congratulate and reset
    # -------------------------------
    elif len(word_list) == 1:
        print(f"\n{'='*50}")
        print(f"ONLY ONE POSSIBLE WORD FOUND!")
        print(f"The word is: {word_list[0].upper()}")
        print(f"{'='*50}\n")
        print(f"Congratulation! You've solved today's Wordle!\n")
        pause_prompt()
        game_menu()
   
    # -------------------------------
    # Otherwise, print all possible words
    # -------------------------------
    else:
        print(f"\nPossible words:\n")

        # Sort and show all
        for word in sorted(word_list):
            print(f"  {word.upper()}")
       
        print(f"\n{'='*50}")
        print(f"TOTAL: {len(word_list)} possible matches")
        print(f"{'='*50}")
        return