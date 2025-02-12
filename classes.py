from abc import ABC,abstractmethod


class Write(ABC):
    @abstractmethod
    def write_to_file(self):
        pass