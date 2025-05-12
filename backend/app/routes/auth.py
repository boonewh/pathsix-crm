from quart import Blueprint, request, jsonify
from app.models import User
from app.database import SessionLocal
from app.utils.auth_utils import verify_password, create_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

@auth_bp.route("/login", methods=["POST"])
async def login():
    data = await request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid credentials"}), 401

        token = create_token(user)

        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "roles": [role.name for role in user.roles]
            },
            "token": token
        })
    finally:
        session.close()