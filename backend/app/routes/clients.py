from quart import Blueprint, request, jsonify
from app.models import Client
from app.database import SessionLocal
from app.utils.security import verify_token
from quart import request

clients_bp = Blueprint("clients", __name__, url_prefix="/api/clients")

@clients_bp.route("/", methods=["GET"])
async def list_clients():
    from app.utils.security import verify_token  # If needed for protection
    db = SessionLocal()
    try:
        payload, error_response, status = verify_token(request)
        if error_response:
            return jsonify(error_response), status

        clients = db.query(Client).all()
        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "created_at": c.created_at.isoformat()
            } for c in clients
        ])
    finally:
        db.close()


@clients_bp.route("/", methods=["POST"])
async def create_client():
    db = SessionLocal()
    try:
        data = await request.get_json()

        client = Client(
            name=data["name"],
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address")
        )

        db.add(client)
        db.commit()
        db.refresh(client)

        return jsonify({
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "address": client.address,
            "created_at": client.created_at.isoformat()
        }), 201

    finally:
        db.close()
