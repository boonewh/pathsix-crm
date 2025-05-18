from quart import Blueprint, request, jsonify
from app.models import User, Role
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth, hash_password

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

@users_bp.route("/", methods=["GET"])
@requires_auth(roles=["admin"])  # Only admins can access
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
                "roles": get_roles(u)
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
            password_hash=hash_password(password)
        )

        # Attach roles
        roles = session.query(Role).filter(Role.name.in_(role_names)).all()
        new_user.roles.extend(roles)

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        return jsonify({
            "id": new_user.id,
            "email": new_user.email,
            "roles": [r.name for r in new_user.roles]
        }), 201

    finally:
        session.close()