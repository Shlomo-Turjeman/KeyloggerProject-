from cryptography.fernet import Fernet

enc_massage = ''
def local_encrypt(text):
    global enc_massage
    key = Fernet.generate_key()
    with open('key.key', 'wb') as key_file:
        key_file.write(key)
    fernet = Fernet(key)
    enc_massage = fernet.encrypt(text.encode())
    return enc_massage

def local_decrypt(enc_text,key_path):
    with open(key_path, "rb") as key_file:
        key = key_file.read()
    fernet = Fernet(key)
    dec_text = fernet.decrypt(enc_text).decode()
    return dec_text

if __name__ == '__main__':
    massage = input("Enter a massage")
    print(local_encrypt(massage))
    deckey = input("Enter the key path: ")
    decmass = enc_massage
    print(local_decrypt(decmass,deckey))