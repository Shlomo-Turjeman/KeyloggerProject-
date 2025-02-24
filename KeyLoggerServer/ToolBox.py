import base64,datetime

def generate_log_filename():
    return "log_" + datetime.datetime.now().strftime("%d-%m-%Y") + ".json"


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