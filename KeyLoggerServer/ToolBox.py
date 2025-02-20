import base64


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