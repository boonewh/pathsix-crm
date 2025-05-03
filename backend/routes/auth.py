from quart import Blueprint, request, jsonify
from passlib.hash import bcrypt
import jwt
import datetime

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

SECRET_KEY = "your-very-secret-key"

# Dummy user
users = {
    "admin@example.com": bcrypt.hash("password123")
}

@auth_bp.route("/login", methods=["POST"])
async def login():
    data = await request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    if email not in users or not bcrypt.verify(password, users[email]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        "sub": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({"token": token})


@auth_bp.route("/protected", methods=["GET"])
async def protected():
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({"message": f"Welcome, {payload['sub']}!"})
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401