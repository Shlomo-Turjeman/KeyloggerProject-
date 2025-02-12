import time,ctypes,locale




#Writen all the function with GPT
def get_keyboard_language():
    try:
        user32 = ctypes.WinDLL('user32', use_last_error=True)
        hwnd = user32.GetForegroundWindow()
        if hwnd == 0:
            thread_id = ctypes.windll.kernel32.GetCurrentThreadId()
        else:
            thread_id = user32.GetWindowThreadProcessId(hwnd, None)
        if not thread_id:
            return "en-US"
        hkl = user32.GetKeyboardLayout(thread_id)
        if not hkl:
            return "en-US"
        language_id = hkl & 0xFFFF
        language = locale.windows_locale.get(language_id, "en-US")
        return language
    except Exception:
        return "en-US"

#Writen the base of the function with GPT
def get_key_language(one_key):
    try:
        if '\u0590' <= one_key <= '\u05FF':
            return "he_IL"
        else:
            return "en_US"
    except Exception as e:
        return f"Error: {e}"


def format_language(one_key,old_l,new_l):
    en_keyboard = ("q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l",";","'","z","x","c","v","b","n","m",",",".","/")
    he_keyboard = ("/","'","ק","ר","א","ט","ו","ן","ם","פ","ש","ד","ג","כ","ע","י","ח","ל","ך","ף",",","ז","ס","ב","ה","נ","מ","צ","ת","ץ",".")
    try:
        if old_l == 'en_US':
            index = en_keyboard.index(one_key)
        elif old_l == 'he_IL':
            index = he_keyboard.index(one_key)
        else:
            index = 0
    except ValueError:
        index = 0
        print(one_key,old_l,new_l)
    if new_l == 'en_US':
        return en_keyboard[index]
    if new_l == 'he_IL':
        return he_keyboard[index]



def format_key(key):

    key1 = str(key).replace("'", "")
    if key1 == 'Key.space':
        return ' '
    elif key1 == 'Key.enter':
        return '\n'
    else:
        key_l = get_key_language(key1)
        keyboard_l = get_keyboard_language()
        if key_l == keyboard_l:
            return key1
        else:
            return format_language(key1,key_l,keyboard_l)
