from flask import Flask, request, jsonify
import os
import time

app = Flask(__name__)
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
    data = request.get_json()
    if not data or "machine" not in data or "data" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    machine = data["machine"].replace("/", "_").replace("..", "_")
    log_data = data["data"]

    machine_folder = os.path.join(DATA_FOLDER, machine)
    os.makedirs(machine_folder, exist_ok=True)

    filename = generate_log_filename()
    file_path = os.path.join(machine_folder, filename)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(log_data)

    return jsonify({"status": "success", "file": file_path}), 200

@app.route('/api/create_machine', methods=['POST'])
def create_machine():
    data = request.get_json()
    if not data or "ip" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    ip = data["ip"]
    response = jsonify({"serial_number":123})
    return response, 200



@app.route('/check_server', methods=['GET'])
def check_server():
    return jsonify({"status": "OK"}), 200


if __name__ == "__main__":
    app.run(port=9734, host='0.0.0.0')
