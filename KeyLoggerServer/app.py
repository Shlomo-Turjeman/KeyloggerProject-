from flask import Flask, request, jsonify, random,string
from flask_cors import CORS
import os
import time

app = Flask(__name__)
CORS(app)
DATA_FOLDER = "logs"


def generate_log_filename():
    return "log_" + time.strftime("%Y_%m_%d_%H_%M_%S") + ".txt"


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


@app.route('/check_server', methods=['GET'])
def check_server():
    return jsonify({"status": "OK"}), 200

@app.route('/api/get_demo',methods = ['GET'])
def get_demo():
    data = [{"time": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8))), "window": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8))), "text": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8)))} for i in range(random.randint(20,50))]
    return jsonify(data), 200


if __name__ == "__main__":
    app.run(port=9734, host='0.0.0.0')
