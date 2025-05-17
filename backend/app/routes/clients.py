from quart import Blueprint, request, jsonify
from app.models import Client
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth

clients_bp = Blueprint("clients", __name__, url_prefix="/api/clients")

@clients_bp.route("/", methods=["GET"])
@requires_auth()
async def list_clients():
    user = request.user
    session = SessionLocal()
    try:
        clients = session.query(Client).filter(Client.tenant_id == user.tenant_id).all()
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
        session.close()

@clients_bp.route("/", methods=["POST"])
@requires_auth()
async def create_client():
    data = await request.get_json()
    user = request.user
    session = SessionLocal()
    try:
        client = Client(
            tenant_id=user.tenant_id,
            name=data["name"],
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address")
        )
        session.add(client)
        session.commit()
        session.refresh(client)
        return jsonify({"id": client.id}), 201
    finally:
        session.close()

@clients_bp.route("/<int:client_id>", methods=["GET"])
@requires_auth()
async def get_client(client_id):
    user = request.user
    session = SessionLocal()
    try:
        client = session.query(Client).filter(
            Client.id == client_id,
            Client.tenant_id == user.tenant_id
        ).first()

        if not client:
            return jsonify({"error": "Client not found"}), 404

        return jsonify({
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "address": client.address,
            "contact_person": client.contact_person,
            "city": client.city,
            "state": client.state,
            "zip": client.zip,
            "notes": client.notes,
            "created_at": client.created_at.isoformat(),
            "accounts": [
                {
                    "id": a.id,
                    "account_number": a.account_number,
                    "account_name": a.account_name,
                    "status": a.status,
                    "opened_on": a.opened_on.isoformat() if a.opened_on else None,
                    "notes": a.notes,
                } for a in client.accounts
            ]
        })
    finally:
        session.close()

@clients_bp.route("/<int:client_id>", methods=["PUT"])
@requires_auth()
async def update_client(client_id):
    data = await request.get_json()
    user = request.user
    session = SessionLocal()
    try:
        client = session.query(Client).filter(
            Client.id == client_id,
            Client.tenant_id == user.tenant_id
        ).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

        for field in ["name", "email", "phone", "address"]:
            if field in data:
                setattr(client, field, data[field])

        session.commit()
        session.refresh(client)
        return jsonify({"id": client.id})
    finally:
        session.close()

@clients_bp.route("/<int:client_id>", methods=["DELETE"])
@requires_auth()
async def delete_client(client_id):
    user = request.user
    session = SessionLocal()
    try:
        client = session.query(Client).filter(
            Client.id == client_id,
            Client.tenant_id == user.tenant_id
        ).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

        session.delete(client)
        session.commit()
        return jsonify({"message": "Client deleted successfully"})
    finally:
        session.close()
