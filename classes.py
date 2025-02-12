from abc import ABC, abstractmethod
from typing import List
import time

class Write(ABC):
    @abstractmethod
    def write(self):
        pass

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