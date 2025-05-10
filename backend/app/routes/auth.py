from quart import Blueprint, request, jsonify
from passlib.hash import bcrypt
import jwt
import datetime
from app.config import SECRET_KEY

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

users = {
    "admin@example.com": bcrypt.hash("password123")
}

user_clients = {
    "admin@example.com": 1,
    "bob@acme.com": 2,
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

    client_id = user_clients.get(email)
    if client_id is None:
        return jsonify({"error": "No client_id found for user"}), 403

    token = jwt.encode({
        "sub": email,
        "client_id": client_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({"token": token})
