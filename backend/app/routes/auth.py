from quart import Blueprint, request, jsonify
from passlib.hash import bcrypt
import jwt
import datetime
from app.config import SECRET_KEY

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

# Dummy user
users = {
    "admin@example.com": bcrypt.hash("password123")
}

@auth_bp.route("/login", methods=["POST"])
async def login():
    from app.utils.security import verify_token

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
    from app.utils.security import verify_token
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    return jsonify({"message": f"Welcome, {payload['sub']}!"})
