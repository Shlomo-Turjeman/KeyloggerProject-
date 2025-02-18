from abc import ABC, abstractmethod


class IKeyLogger(ABC):
    @abstractmethod
    def on_press(self, key) -> None:
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


class Write(ABC):
    @abstractmethod
    def write(self, data: str) -> bool:
        pass
