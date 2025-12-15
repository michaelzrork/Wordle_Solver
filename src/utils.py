######### Utility Functions #########

# -------------------------------
# Pause Prompt
# -------------------------------

def pause_prompt():
    pause_input = input(f"\nPress any key to continue...")
    if pause_input == '' or pause_input != '':
        return