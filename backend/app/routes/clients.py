from quart import Blueprint, request, jsonify
from app.models import Client, ActivityLog, ActivityType
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth
from datetime import datetime

clients_bp = Blueprint("clients", __name__, url_prefix="/api/clients")

@clients_bp.route("/", methods=["GET"])
@requires_auth()
async def list_clients():
    user = request.user
    session = SessionLocal()
    try:
        clients = session.query(Client).filter(
            Client.tenant_id == user.tenant_id,
            Client.created_by == user.id,
            Client.deleted_at == None
        ).all()

        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "contact_person": c.contact_person,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "city": c.city,
                "state": c.state,
                "zip": c.zip,
                "notes": c.notes,
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
            created_by=user.id,
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
            Client.tenant_id == user.tenant_id,
            Client.created_by == user.id,
            Client.deleted_at == None
        ).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

        # Log the view
        log = ActivityLog(
            tenant_id=user.tenant_id,
            user_id=user.id,
            action=ActivityType.viewed,
            entity_type="client",
            entity_id=client.id,
            description=f"Viewed client '{client.name}'"
        )
        session.add(log)

        session.commit()
        session.refresh(client)

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
            "created_at": client.created_at.isoformat()
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

        for field in [
            "name", "contact_person", "email", "phone",
            "address", "city", "state", "zip", "notes"
        ]:
            if field in data:
                setattr(client, field, data[field])
        
        client.updated_by = user.id
        client.updated_at = datetime.utcnow()  # Only needed if you drop onupdate later

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

        client.deleted_at = datetime.utcnow()
        client.deleted_by = user.id
        session.commit()
        return jsonify({"message": "Client soft-deleted successfully"})

    finally:
        session.close()

