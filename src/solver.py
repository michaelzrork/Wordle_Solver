######### Solver Functions #########

# -------------------------------
# Fetch words
# -------------------------------

def fetch_words(excluded_letters, included_letters, doubled_letters, solved_positions, not_positions, words, num_letters):
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