# -------------------------------
# Imports
# -------------------------------

import urllib.request
from src.utils import pause_prompt
from src.game_utils import quit_game

# -------------------------------
# Variables
# -------------------------------

words = []
scrabble_list = ('https://raw.githubusercontent.com/redbo/scrabble/master/dictionary.txt','Scrabble Allowed Words') # Scrabble allowed words list
stanford_list = ('https://www-cs-faculty.stanford.edu/~knuth/sgb-words.txt','Stanford Wordle Answers') # Stanford Wordle list
cfreshman_list = ('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/c46f451920d5cf6326d550fb2d6abb1642717852/wordle-answers-alphabetical.txt','cfreshman Wordle Solutions') # cfreshman Wordle answers list
answer_lists = [scrabble_list, stanford_list, cfreshman_list]
selected_answer_list = "No List Selected"
            
# -------------------------------
# Answer List Selection
# -------------------------------

def pick_answer_list():
    global words, selected_answer_list, answer_lists
    
    print(f"\n{'='*50}")
    print(f"WORDLE SOLVER - ANSWER LIST SELECTION")
    print(f"{'='*50}")
    
    print(f"\nPlease select the word list you would like to use:\n")
    print(f"1. {answer_lists[0][1]} - Full Scrabble dictionary")
    print(f"2. {answer_lists[1][1]} - Official Wordle Answers")
    print(f"3. {answer_lists[2][1]} - Official Wordle Solutions")
    print(f"4. Back to Game Menu")
    print(f"5. Exit")

    while True:
        n = input(f"\nEnter selection: ").strip()
        
        if n in ['1','2','3']:
            if returned := get_words_from_url(answer_lists[int(n) - 1]):
                print(f"{selected_answer_list[1]} loaded successfully.")
                pause_prompt()
                break
            else:
                print(f"Failed to load {answer_lists[int(n) - 1][1]}. No changes made. Please try again.")
                pause_prompt()
                continue
        elif n == '':
            print(f"\nPlease make a seclection and try again.")
            pause_prompt()
            continue
        elif n == '4':
            print(f"\nAnswer list unchanged. Returning to Game Menu...")
            pause_prompt()
            return
        elif n == '5':
            quit_game()
            continue
        else:
            print(f"Invalid selection. Please try again.")
            pause_prompt()
            continue
        
# -------------------------------
# Fetch words from URL
# ------------------------------- 
    
def get_words_from_url(list_selection):
    global words, selected_answer_list
    try:
        response = urllib.request.urlopen(list_selection[0])
        words = response.read().decode('utf-8').splitlines()
        selected_answer_list = list_selection
        return True
    except:
        return False