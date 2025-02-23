import time, ctypes, locale, tempfile
from pathlib import Path

foreign_keys = []


# returns the keyboard language of the current thread
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


# returns the language of the key
def get_key_language(one_key):
    try:
        if '\u0590' <= one_key <= '\u05FF':
            return "he_IL"
        else:
            return "en_US"
    except Exception as e:
        return f"Error: {e}"


# replace the key language with the second language, only between English and Hebrew
def format_language(one_key, old_l, new_l):
    en_keyboard = (
    "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "z", "x",
    "c", "v", "b", "n", "m", ",", ".", "/")
    he_keyboard = (
    "/", "'", "ק", "ר", "א", "ט", "ו", "ן", "ם", "פ", "ש", "ד", "ג", "כ", "ע", "י", "ח", "ל", "ך", "ף", ",", "ז", "ס",
    "ב", "ה", "נ", "מ", "צ", "ת", "ץ", ".")
    try:
        if old_l == 'en_US':
            index = en_keyboard.index(one_key)
        elif old_l == 'he_IL':
            index = he_keyboard.index(one_key)
        else:
            index = 0
    except ValueError:
        index = 0
    if new_l == 'en_US':
        return en_keyboard[index]
    if new_l == 'he_IL':
        return he_keyboard[index]


# return formated key with current language
def format_key(key):
    global foreign_keys
    number_keyboard = ("<96>", "<97>", "<98>", "<99>", "<100>", "<101>", "<102>", "<103>", "<104>", "<105>")
    foreign_keyboard = {
        "<110>": '.',
        "<111>": '/',
        "<186>": ';',
        "<187>": '=',
        "<188>": ',',
        "<107>": '+',
        "<109>": '-',
        "<191>":'\n',
        "Key.space": ' ',
        "Key.enter": '\n'
    }
    key1 = str(key).replace("'", "")
    if key1 in number_keyboard:
        return str(number_keyboard.index(key1))
    elif key1 in foreign_keyboard:
        return foreign_keyboard[key1]
    elif key1.startswith('Key') or key1.startswith('\\x'):
        foreign_keys.append(key1)
        return ''
    else:
        key_l = get_key_language(key1)
        keyboard_l = get_keyboard_language()
        if key_l == keyboard_l:
            return key1
        else:
            return format_language(key1, key_l, keyboard_l)


def get_file_path(filename="data.json"):
    temp_dir = Path(tempfile.gettempdir())
    json_file_path = rf"{temp_dir}\{filename}"
    return json_file_path