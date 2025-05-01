from quart import Blueprint, request, jsonify
from passlib.hash import bcrypt
import jwt
import datetime

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

SECRET_KEY = "your-very-secret-key"

# Dummy user
users = {
    "admin": bcrypt.hash("password123")
}

@auth_bp.route("/login", methods=["POST"])
async def login():
    data = await request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    if username not in users or not bcrypt.verify(password, users[username]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({"token": token})
