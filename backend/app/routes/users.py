from quart import Blueprint, request, jsonify
from app.models import User, Role, ActivityLog, ActivityType
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth, hash_password

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

@users_bp.route("/", methods=["GET"])
@requires_auth(roles=["admin"])
async def list_users():
    user = request.user
    session = SessionLocal()
    try:
        users = session.query(User).filter(User.tenant_id == user.tenant_id).all()

        def get_roles(u):
            return [r.name for r in u.roles]

        return jsonify([
            {
                "id": u.id,
                "email": u.email,
                "created_at": u.created_at.isoformat(),
                "roles": get_roles(u),
                "is_active": u.is_active
            }
            for u in users
        ])
    finally:
        session.close()

@users_bp.route("/", methods=["POST"])
@requires_auth(roles=["admin"])
async def create_user():
    user = request.user
    data = await request.get_json()
    session = SessionLocal()
    try:
        email = data.get("email")
        password = data.get("password")
        role_names = data.get("roles", [])

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if session.query(User).filter_by(email=email).first():
            return jsonify({"error": "User already exists"}), 400

        new_user = User(
            tenant_id=user.tenant_id,
            email=email,
            password_hash=hash_password(password),
            is_active=True
        )

        roles = session.query(Role).filter(Role.name.in_(role_names)).all()
        new_user.roles.extend(roles)

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        return jsonify({
            "id": new_user.id,
            "email": new_user.email,
            "roles": [r.name for r in new_user.roles],
            "is_active": new_user.is_active
        }), 201

    finally:
        session.close()

@users_bp.route("/<int:user_id>/toggle-active", methods=["PUT"])
@requires_auth(roles=["admin"])
async def toggle_user_active(user_id):
    user = request.user
    session = SessionLocal()
    try:
        target = session.query(User).filter(
            User.id == user_id,
            User.tenant_id == user.tenant_id
        ).first()

        if not target:
            return jsonify({"error": "User not found"}), 404

        target.is_active = not target.is_active
        session.commit()

        return jsonify({
            "id": target.id,
            "is_active": target.is_active
        })
    finally:
        session.close()
