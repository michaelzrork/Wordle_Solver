import urllib.request

# -------------------------------
# Variables
# -------------------------------

num_rounds = 6 # default number of rounds
num_letters = 5 # default number of letters
url = ''
words = []
answer_list = "cfreshman Wordle Answers List"
excluded_letters = set()
included_letters = set()
doubled_letters = set()
solved_positions = [''] * num_letters
not_positions = [set() for _ in range(num_letters)]

# -------------------------------
# Answer Lists
# -------------------------------

# Scrabble allowed words list
link1 = 'https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt'
# Stanford Wordle list
link2 = 'https://www-cs-faculty.stanford.edu/~knuth/sgb-words.txt'
# cfreshman Wordle answers list
link3 = 'https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/c46f451920d5cf6326d550fb2d6abb1642717852/wordle-answers-alphabetical.txt' 

# -------------------------------
# Initialize with default answer list
# -------------------------------

try:
    response = urllib.request.urlopen(link3)
    words = response.read().decode('utf-8').splitlines()
except:
    answer_list = "No answer list loaded"
    words = []

# -------------------------------
# Helpers
# -------------------------------

def pause_prompt():
    pause_input = input(f"\nPress any key to continue...")
    if pause_input == '' or pause_input != '':
        return
    
def set_defaults():
    global num_rounds
    global num_letters
    global answer_list
    global words
    global link3
    num_rounds = 6
    num_letters = 5
    answer_list = "cfreshman Wordle Answers List"
    try:
        response = urllib.request.urlopen(link3)
        words = response.read().decode('utf-8').splitlines()
        print(f"\nGame settings have been reset to defaults.")
    except:
        answer_list = "No answer list loaded"
        words = []
        print(f"\nGame settings have been reset to defaults, but failed to load the default answer list.")

# --------------------------------
# Game Menu
# --------------------------------

def game_menu():
    global num_rounds
    global num_letters
    global answer_list
    global link3
    global words
    
    while True:
        print(f"\n{'='*50}")
        print(f"WORDLE SOLVER - GAME MENU")
        print(f"{'='*50}")
        print(f"\nSelect One:")
        print(f"1. Start Game")
        print(f"2. Set number of letters (current: {num_letters})")
        print(f"3. Set number of rounds (current: {num_rounds})")
        print(f"4. Select answer list (curerent: {answer_list})")
        print(f"5. Reset to defaults.")
        print(f"6. Exit")

        choice = input(f"\nEnter choice: ").strip()
        if choice == '3':
            set_num_rounds(num_rounds)
        elif choice == '2':
            set_num_letters(num_letters)
        elif choice == '4':
            if num_letters != 5:
                print(f"\nAnswer list selection is disabled.\nSet the number of letters back to 5 to select a different answer list.")
                pause_prompt()
            else:
                pick_answer_list()    
        elif choice == '1':
            print(f"\nStarting the game with {num_rounds} rounds and {num_letters} letters using the {answer_list}...\n")
            play_game()
        elif choice == '5':
            set_defaults()
            pause_prompt()
        elif choice == '6' or choice == 'exit' or choice == 'quit':
            print(f"Exiting the program. Goodbye!")
            exit()
        else:
            print(f"Invalid choice. Please select a number 1-5.")

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
    global words
    global answer_list
    global link1
    num_letters = input(f"\nEnter the number of letters in the word (default is 5): ").strip()
            
    if num_letters.isdigit() and int(num_letters) >= 1:
        num_letters = int(num_letters)
        print(f"You have selected to play with {num_letters} letters.")
        if num_letters != 5:
            try:
                response = urllib.request.urlopen(link1)
                words = response.read().decode('utf-8').splitlines()
                answer_list = "Scrabble Allowed Words"
                print(f"\nAnswer list updated to Scrabble Allowed Words to accommodate different word lengths.") 
                pause_prompt()
            except:
                answer_list = "Unable to load answer list."
                pause_prompt()
                words = []
        else:
            pause_prompt()
    else:
        num_letters = 5
        print(f"Invalid input. Defaulting to 5 letters.")  
        pause_prompt()
        
            
# -------------------------------
# Answer List Selection
# -------------------------------

def pick_answer_list():
    global words
    global answer_list
    global link1
    global link2
    global link3
    print(f"\nPlease select the answer list you would like to use:\n")
    print(f"1. Scrabble Allowed Words List - Full Scrabble dictionary (any length word, least restrictive)")
    print(f"2. Stanford Wordle List - Official Wordle Answers (5 word length only, moderately restrictive)")
    print(f"3. cfreshman Wordle Answers List - Official Wordle Solutions (most restrictive)")
    print(f"4. Back to Game Menu")
    print(f"5. Exit")

    while True:
        choice = input(f"\nEnter choice: ").strip()
        if choice == '':
            print(f"\nPlease make a seclection and try again.")
            continue
        elif choice == '1':
            url = link1
            answer_list = "Scrabble Allowed Words"
            print(f"\nYou have selected the {answer_list}\n")
            pause_prompt()  
            break
        elif choice == '2':
            url = link2
            answer_list = "Stanford Wordle List"
            print(f"\nYou have selected the {answer_list}\n")
            pause_prompt()
            break
        elif choice == '3':
            url = link3
            answer_list = "cfreshman Wordle Answers List"
            print(f"\nYou have selected the {answer_list}\n")
            pause_prompt()
            break
        elif choice == '4':
            print(f"\nAnswer list unchanged. Returning to Game Menu...\n")
            pause_prompt()
            return
        elif choice == '5':
            quit_choice = input(f"Are you sure you want to exit the program? (y/n): ").strip().lower()
            print(f"Exiting the program. Goodbye!")
            exit()
        else:
            print(f"Invalid selection. Please try again.")
            continue

    try:
        response = urllib.request.urlopen(url)
        words = response.read().decode('utf-8').splitlines()
    except:
        words = []

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
   
    # -------------------------------
    # Initialize/reset variables
    # -------------------------------
    reset_game_state()
   
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
    global words
    global excluded_letters
    word_list = fetch_words()
   
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
        
# -------------------------------
# Fetch words
# -------------------------------

def fetch_words():
    global excluded_letters
    global included_letters
    global doubled_letters
    global solved_positions
    global not_positions
    global words
    global num_letters

    matches = []
    for word in words:
        word = word.lower().strip()
   
        # -------------------------------
        # Word must be 5 letters long
        # -------------------------------
   
        if len(word) != num_letters:
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
       
        if any(solved_positions[i] != '' and word[i] != solved_positions[i] for i in range(num_letters)):
            continue
       
        # -------------------------------
        # Position N cannot equal letter X (Yellow letters)
        # -------------------------------

        if any(word[i] in not_positions[i] for i in range(num_letters)):
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
# Start game loop
# -------------------------------

print(f"\n")
print(f"{'*'*50}")
print(f"Welcome to the Wordle Solver!")
print(f"{'*'*50}")

game_menu() 