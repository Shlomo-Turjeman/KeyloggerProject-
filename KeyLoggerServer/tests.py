from flask import Flask, request, jsonify, make_response
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # יש לשנות מפתח זה!
jwt = JWTManager(app)

users = {  # מסד נתונים לדוגמה
    "user1": "password123",
    "admin": "adminpass"
}


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username in users and users[username] == password:
        access_token = create_access_token(identity=username)
        response = make_response(jsonify({"msg": "Login successful"}))
        response.set_cookie("access_token", access_token, httponly=True, samesite='Strict')
        return response
    return jsonify({"msg": "Invalid credentials"}), 401


@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({"logged_in_as": current_user}), 200


if __name__ == '__main__':
    app.run(debug=True,port=9734)
