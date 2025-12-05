import urllib.request

# -------------------------------
# Variables
# -------------------------------

reset_game = True
words = []
excluded_letters = set()
included_letters = set()
doubled_letters = set()
solved_positions = [''] * 5
not_positions = [set() for _ in range(5)]

# -------------------------------
# Fetch words
# -------------------------------

def fetch_words():
    global excluded_letters
    global included_letters
    global doubled_letters
    global solved_positions
    global not_positions

    matches = []
    for word in words:
        word = word.lower().strip()
   
        # -------------------------------
        # Word must be 5 letters long
        # -------------------------------
   
        if len(word) != 5:
            continue
   
        # -------------------------------
        # Can't contain excluded letters (Black/Gray)
        # -------------------------------
   
        if any(letter in excluded_letters for letter in word):
            continue
       
        # -------------------------------
        # Must contain included letters (Yellow or Green)
        # -------------------------------
       
        if any(letter not in word for letter in included_letters):
            continue
   
        # -------------------------------  
        # Position N must equal letter X (Green letters)
        # -------------------------------
       
        if any(solved_positions[i] != '' and word[i] != solved_positions[i] for i in range(5)):
            continue
       
        # -------------------------------
        # Position N cannot equal letter X (Yellow letters)
        # -------------------------------

        if any(word[i] in not_positions[i] for i in range(5)):
            continue
       
        # -------------------------------
        # Handle double letter cases
        # -------------------------------
       
        if any(word.count(letter) < 2 for letter in doubled_letters):
            continue
       
        # -------------------------------
        # If all conditions met, add to matches
        # -------------------------------
       
        matches.append(word)
       
    # -------------------------------
    # Return matches
    # -------------------------------
   
    return matches

# -------------------------------
# Print list
# -------------------------------

def print_list(round):  
    word_list = fetch_words()
   
    # -------------------------------
    # If word list is empty, show message and reset
    # -------------------------------
    if len(word_list) == 0:
        print("\nNo possible words found with the current constraints.\nGame aborted. Please check your inputs and try again.\n")
        new_game_prompt()
        return
   
    # -------------------------------
    # If it is the 6th round and not solved, show message and reset
    # -------------------------------
    elif round == 5 and any(letter == '' for letter in solved_positions):
        print(f"\n{'='*50}")
        print("\nMaximum rounds reached. The possible words were:\n")
        for word in sorted(word_list):
            print(f"  {word.upper()}")
        new_game_prompt()
        return
   
    # -------------------------------
    # If it is the 6th round and solved, congratulate and reset
    # -------------------------------
    elif round == 5 and all(letter != '' for letter in solved_positions):
        print(f"\n{'='*50}")
        print(f"CONGRATULATIONS! You've solved today's Wordle!")
        print(f"The word is: {word_list[0].upper()}")
        print(f"{'='*50}\n")
        new_game_prompt()
        return
   
    # -------------------------------
    # If only one word found, congratulate and reset
    # -------------------------------
    elif len(word_list) == 1:
        print(f"\n{'='*50}")
        print(f"ONLY ONE POSSIBLE WORD FOUND!")
        print(f"The word is: {word_list[0].upper()}")
        print(f"{'='*50}\n")
        print("Congratulation! You've solved today's Wordle!\n")
        new_game_prompt()
        return
   
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

# -------------------------------
# New game prompt
# -------------------------------
def new_game_prompt():
    new_game = input("\nPress Enter to start a new game, or type 'exit' to quit: ").strip().lower()
    if new_game == 'exit' or new_game == 'quit':
        print("Thank you for playing! Goodbye!")
        exit()
    else:
        print("\nStarting a new game...\n")
        reset_game_state()
    return

# --------------------------------
# Reset game state
# --------------------------------

def reset_game_state():
    global reset_game
    global excluded_letters
    global included_letters
    global doubled_letters
    global solved_positions
    global not_positions
    doubled_letters = set()
    solved_positions = [''] * 5
    not_positions = [set() for _ in range(5)]
    excluded_letters = set()
    included_letters = set()
    reset_game = True
   
# -------------------------------
# Play Game
# -------------------------------

def play_game():
    global reset_game
    global excluded_letters
    global included_letters
    global doubled_letters
    global solved_positions
    global not_positions
   
    # -------------------------------
    # Initialize/reset variables
    # -------------------------------
    reset_game_state()
    reset_game = False
    is_reset = False
   
    # -------------------------------
    # Game loop - up to 6 rounds
    # -------------------------------
    for round in range(6):
       
        print(f"\n{'='*20} ROUND {round+1} {'='*20}\n")
       
        valid_guess = False
        while valid_guess != True:
            # -------------------------------
            # prompt user for guess
            # -------------------------------
            guess = input("Type in your guess or type 'exit' to quit: ").strip().lower()
            # -------------------------------
            # if user wants to exit, confirm and quit
            # -------------------------------
            if guess == 'exit' or guess == 'quit':
                confirm_quit = input("Are you sure you want to quit? (y/n): ").strip().lower()
                if confirm_quit == 'y':
                    print("Thank you for playing! Goodbye!")
                    exit()
                else:
                    continue
            # -------------------------------
            # if not 5 letters, show error and re-prompt
            # -------------------------------
            elif guess != "" and len(guess) != 5:
                print("Error: Guess must be exactly 5 letters long. Please try again.")
                continue
            # -------------------------------
            # if contains non-letters, show error and re-prompt
            # -------------------------------
            elif guess != "" and any(char not in 'abcdefghijklmnopqrstuvwxyz' for char in guess):
                print("Error: Guess must only contain letters A-Z. Please try again.")
                continue
            # -------------------------------
            # if empty input, handle reset logic
            # -------------------------------
            elif guess == "" and is_reset == False:
                print("No guess entered. Try again or press enter to reset game.")
                is_reset = True
                continue
            # -------------------------------
            # if empty input and already indicated reset, reset game state
            # -------------------------------
            elif guess == "" and is_reset == True:
                print("Game has been reset. Starting a new game...\n")
                reset_game_state()
                return
            # -------------------------------
            # valid guess  
            # -------------------------------
            else:
                valid_guess = True
       
        if guess != "":
            # -------------------------------
            # initialize guess state
            # -------------------------------
            guess_state = [('', '')] * 5
            # -------------------------------
            # prompt user for letter states
            # -------------------------------
            print("\nEnter the state of each letter in your guess\n'g' for green, 'y' for yellow, 'b' for black/gray\n")
            for i in range(5):
                # -------------------------------
                # if letter already confirmed green, skip
                # -------------------------------
                if solved_positions[i] != '' and guess[i] == solved_positions[i]:
                    guess_state[i] = (guess[i], 'g') # this is unnecessary but keeps structure consistent
                    print(f"Position {i+1} is '{guess[i].upper()}': CONFIRMED GREEN")
                    continue
                valid_state = False
                while valid_state == False:
                    # -------------------------------
                    # prompt user for letter state
                    # -------------------------------
                    state = input(f"Position {i+1} is '{guess[i].upper()}': ").strip().lower()
                    # -------------------------------
                    # if user wants to exit, confirm and quit
                    # -------------------------------
                    if state == 'exit' or state == 'quit':
                        print("Thank you for playing! Goodbye!")
                        exit()
                    # -------------------------------
                    # if black/gray, add to excluded letters
                    # -------------------------------
                    if state == 'b':
                        valid_state = True
                        # only add to excluded letters if not in included letters
                        if guess[i] in included_letters:
                            not_positions[i].add(guess[i])
                        else:
                            excluded_letters.add(guess[i])

                    # -------------------------------
                    # if green, set correct position    
                    # -------------------------------
                    elif state == 'g':
                        valid_state = True
                        solved_positions[i] = guess[i]
                        # -------------------------------
                        # Add to included letters
                        # -------------------------------
                        included_letters.add(guess[i])
                    # -------------------------------
                    # if yellow, add to not position and included letters
                    # -------------------------------
                    elif state == 'y':
                        valid_state = True
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
                    # -------------------------------
                    # invalid state entered
                    # -------------------------------
                    else:
                        print("Invalid state entered. Please enter 'g', 'y', or 'b'.")
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
        # If guess is empty (reset), break to outer loop
        # -------------------------------            
        else:
            break
       
        # -------------------------------
        # Print possible words
        # -------------------------------        
        print_list(round)
        # -------------------------------
        # If game reset, break to outer loop
        # -------------------------------
        if reset_game == True:
            break

# -------------------------------
# main block
# -------------------------------

# Download Scrabble allowed words list
link1 = 'https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt'
# Download Stanford Wordle list
link2 = 'https://www-cs-faculty.stanford.edu/~knuth/sgb-words.txt'
# Download cfreshman Wordle answers list
link3 = 'https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/c46f451920d5cf6326d550fb2d6abb1642717852/wordle-answers-alphabetical.txt'

# -------------------------------
# Welcome message and word list selection
# -------------------------------
def pick_word_list():
    global words
    print("\nPlease select the word list you would like to use\n")
    print("1. Scrabble Allowed Words")
    print("2. Stanford Wordle List")
    print("3. cfreshman Wordle Answers List (most restrictive)")

    choice = input("\nEnter choice (1/2/3): ").strip()
    if choice == '1':
        url = link1
        print("\nYou have selected the Scrabble Allowed Words list\n")
    elif choice == '2':
        url = link2
        print("\nYou have selected the Stanford Wordle List\n")
    elif choice == '3':
        print("\nYou have selected the cfreshman Wordle Answers List\n")
        url = link3
    elif choice == 'exit' or choice == 'quit':
        print("Exiting the program. Goodbye!")
        exit()
    else:
        print("Invalid choice. Defaulting to cfreshman Wordle Answers List.")
        url = link3

    try:
        response = urllib.request.urlopen(url)
        words = response.read().decode('utf-8').splitlines()
    except:
        words = []

# -------------------------------
# Start game loop
# -------------------------------

print("\n")
print(f"{'='*50}")
print("Welcome to the Wordle Solver!")
print(f"{'='*50}")

pick_word_list()

print(f"{'='*50}")
print("\nLet's begin! This program will give you a list of all possible Wordle solutions based on your current game state!\n\nInstructions for use:\n1. Enter your guess\n2. Confirm the state of each letter\n3. See possible words\n4. Enter second guess\n5. Repeat until solved!")

while reset_game == True:
    play_game()
    list_option = input("\nWould you like to pick a new word list? (y/n): ").strip().lower()
    if list_option == 'y':
        pick_word_list()
    elif list_option == 'n':
        pass
    elif list_option == 'exit' or list_option == 'quit':
        print("Exiting the program. Goodbye!")
        exit()
    else:
        print("Invalid choice. Continuing with current word list.")
