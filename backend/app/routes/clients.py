from quart import Blueprint, request, jsonify
from app.models import Client
from app.database import SessionLocal
from app.utils.security import verify_token

clients_bp = Blueprint("clients", __name__, url_prefix="/api/clients")


@clients_bp.route("/", methods=["GET"])
async def list_clients():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    client_id = payload["client_id"]
    db = SessionLocal()
    try:
        clients = db.query(Client).filter(Client.client_id == client_id).all()
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
        db.close()


@clients_bp.route("/", methods=["POST"])
async def create_client():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    client_id = payload["client_id"]
    data = await request.get_json()

    db = SessionLocal()
    try:
        client = Client(
            client_id=client_id,
            name=data["name"],
            contact_person=data.get("contact_person"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            zip=data.get("zip"),
            notes=data.get("notes")
        )

        db.add(client)
        db.commit()
        db.refresh(client)

        return jsonify({
            "id": client.id,
            "name": client.name,
            "contact_person": client.contact_person,
            "email": client.email,
            "phone": client.phone,
            "address": client.address,
            "city": client.city,
            "state": client.state,
            "zip": client.zip,
            "notes": client.notes,
            "created_at": client.created_at.isoformat()
        }), 201

    finally:
        db.close()


@clients_bp.route("/<int:client_id>", methods=["PUT"])
async def update_client(client_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    token_client_id = payload["client_id"]
    data = await request.get_json()

    db = SessionLocal()
    try:
        client = db.query(Client).filter(Client.id == client_id, Client.client_id == token_client_id).first()

        if not client:
            return jsonify({"error": "Client not found"}), 404

        client.name = data.get("name", client.name)
        client.contact_person = data.get("contact_person", client.contact_person)
        client.email = data.get("email", client.email)
        client.phone = data.get("phone", client.phone)
        client.address = data.get("address", client.address)
        client.city = data.get("city", client.city)
        client.state = data.get("state", client.state)
        client.zip = data.get("zip", client.zip)
        client.notes = data.get("notes", client.notes)

        db.commit()
        db.refresh(client)

        return jsonify({
            "id": client.id,
            "name": client.name,
            "contact_person": client.contact_person,
            "email": client.email,
            "phone": client.phone,
            "address": client.address,
            "city": client.city,
            "state": client.state,
            "zip": client.zip,
            "notes": client.notes,
            "created_at": client.created_at.isoformat()
        })
    finally:
        db.close()


@clients_bp.route("/<int:client_id>", methods=["DELETE"])
async def delete_client(client_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    token_client_id = payload["client_id"]

    db = SessionLocal()
    try:
        client = db.query(Client).filter(Client.id == client_id, Client.client_id == token_client_id).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

        db.delete(client)
        db.commit()

        return jsonify({"message": "Client deleted successfully"})
    finally:
        db.close()
