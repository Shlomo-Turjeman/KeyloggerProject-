


def merge_dicts(*dicts: dict[:str]) -> dict:
    dict_to_ret = dicts[0]
    if len(dicts) > 1:
        for one_dict in dicts[1:]:
            for key, val in one_dict.items():
                if key not in dict_to_ret:
                    dict_to_ret[key] = ""
                dict_to_ret[key] += val

    return dict_to_ret

def encrypt(key,data:str) -> str:
    plaintext = ""
    length_key = len(key)
    for index in range(len(data)):
        ciphertext += chr(ord(data[index]) ^ ord(key[index % length_key]))
    return ciphertext