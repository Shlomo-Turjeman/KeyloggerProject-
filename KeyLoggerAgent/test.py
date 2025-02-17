import win32gui
import win32api
import win32process
import psutil
import ctypes
import time


# פונקציה לקבלת שם התהליך הפעיל
def get_active_window_info():
    hwnd = win32gui.GetForegroundWindow()  # מזהה את החלון הפעיל
    _, pid = win32process.GetWindowThreadProcessId(hwnd)  # מזהה את ה-PID של התהליך

    try:
        process = psutil.Process(pid)
        process_name = process.name()
    except psutil.NoSuchProcess:
        process_name = "Unknown Process"

    window_title = win32gui.GetWindowText(hwnd)
    return hwnd, process_name, window_title


# פונקציה לקבלת קוד פריסת המקלדת
def get_keyboard_layout(hwnd):
    thread_id, _ = win32process.GetWindowThreadProcessId(hwnd)
    klid = win32api.GetKeyboardLayout(thread_id)
    return klid & 0xFFFF


# פונקציה להמרת מזהה השפה לשם קריא
def language_id_to_name(language_id):
    locale_name = ctypes.create_unicode_buffer(85)
    if ctypes.windll.kernel32.GetLocaleInfoW(language_id, 0x00000002, locale_name, len(locale_name)) > 0:
        return locale_name.value
    return f"Unknown Language ID: {language_id}"


# לולאה לזיהוי שינויים
last_window = None
last_lang = None

while True:
    hwnd, process_name, window_title = get_active_window_info()
    lang_id = get_keyboard_layout(hwnd)
    lang_name = language_id_to_name(lang_id)

    if (process_name, window_title, lang_name) != (last_window, last_lang):
        print(f"תוכנה פעילה: {process_name} | חלון: {window_title} | פריסת מקלדת: {lang_name}")
        last_window = (process_name, window_title)
        last_lang = lang_name

    time.sleep(0.2)  # הפחתת זמן ההשהיה כדי לקלוט שינויים בזמן אמת
