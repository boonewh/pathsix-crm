from quart import Blueprint, request, jsonify
from app.models import Client, ActivityLog, ActivityType
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth
from datetime import datetime
from sqlalchemy import or_

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

        response = jsonify([
            {
                "id": c.id,
                "name": c.name,
                "contact_person": c.contact_person,
                "contact_title": c.contact_title,
                "email": c.email,
                "phone": c.phone,
                "phone_label": c.phone_label,
                "secondary_phone": c.secondary_phone,
                "secondary_phone_label": c.secondary_phone_label,
                "address": c.address,
                "city": c.city,
                "state": c.state,
                "zip": c.zip,
                "notes": c.notes,
                "created_at": c.created_at.isoformat() + "Z"
            } for c in clients
        ])
        response.headers["Cache-Control"] = "no-store"
        return response
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
            contact_person=data.get("contact_person"),
            contact_title=data.get("contact_title"),
            email=data.get("email"),
            phone=data.get("phone"),
            phone_label=data.get("phone_label", "work"),
            secondary_phone=data.get("secondary_phone"),
            secondary_phone_label=data.get("secondary_phone_label"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            zip=data.get("zip"),
            notes=data.get("notes"),
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
            Client.deleted_at == None,
            or_(
                Client.created_by == user.id,
                Client.assigned_to == user.id
            )
        ).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

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

        response = jsonify({
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "phone_label": client.phone_label,
            "secondary_phone": client.secondary_phone,
            "secondary_phone_label": client.secondary_phone_label,
            "address": client.address,
            "contact_person": client.contact_person,
            "contact_title": client.contact_title,
            "city": client.city,
            "state": client.state,
            "zip": client.zip,
            "notes": client.notes,
            "created_at": client.created_at.isoformat() + "Z"
        })
        response.headers["Cache-Control"] = "no-store"
        return response
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
            Client.tenant_id == user.tenant_id,
            Client.deleted_at == None,
            or_(
                Client.created_by == user.id,
                Client.assigned_to == user.id
            )
        ).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

        for field in [
            "name", "contact_person", "contact_title", "email", "phone", "phone_label",
            "secondary_phone", "secondary_phone_label",
            "address", "city", "state", "zip", "notes"
        ]:
            if field in data:
                setattr(client, field, data[field])

        client.updated_by = user.id
        client.updated_at = datetime.utcnow()

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
            Client.tenant_id == user.tenant_id,
            Client.deleted_at == None,
            or_(
                Client.created_by == user.id,
                Client.assigned_to == user.id
            )
        ).first()
        if not client:
            return jsonify({"error": "Client not found"}), 404

        client.deleted_at = datetime.utcnow()
        client.deleted_by = user.id
        session.commit()
        return jsonify({"message": "Client soft-deleted successfully"})
    finally:
        session.close()


@clients_bp.route("/<int:client_id>/assign", methods=["PUT"])
@requires_auth(roles=["admin"])
async def assign_client(client_id):
    user = request.user
    data = await request.get_json()
    assigned_to = data.get("assigned_to")

    if not assigned_to:
        return jsonify({"error": "Missing assigned_to"}), 400

    session = SessionLocal()
    try:
        client = session.query(Client).filter(
            Client.id == client_id,
            Client.tenant_id == user.tenant_id,
            Client.deleted_at == None
        ).first()

        if not client:
            return jsonify({"error": "Client not found"}), 404

        client.assigned_to = assigned_to
        client.updated_by = user.id
        client.updated_at = datetime.utcnow()

        session.commit()
        return jsonify({"message": "Client assigned successfully"})
    finally:
        session.close()

@clients_bp.route("/all", methods=["GET"])
@requires_auth(roles=["admin"])
async def list_all_clients():
    user = request.user
    session = SessionLocal()
    try:
        clients = session.query(Client).filter(
            Client.tenant_id == user.tenant_id,
            Client.deleted_at == None
        ).all()

        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "phone_label": c.phone_label,
                "secondary_phone": c.secondary_phone,
                "secondary_phone_label": c.secondary_phone_label,
                "contact_person": c.contact_person,
                "contact_title": c.contact_title,
                "created_by": c.created_by,
                "assigned_to_name": c.assigned_user.email if c.assigned_user else None,
                "created_by_name": c.created_by_user.email if c.created_by_user else None,
            } for c in clients
        ])
    finally:
        session.close()

@clients_bp.route("/assigned", methods=["GET"])
@requires_auth()
async def list_assigned_clients():
    user = request.user
    session = SessionLocal()
    try:
        clients = session.query(Client).filter(
            Client.tenant_id == user.tenant_id,
            Client.assigned_to == user.id,
            Client.deleted_at == None
        ).all()

        return jsonify([
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "phone_label": c.phone_label,
                "secondary_phone": c.secondary_phone,
                "secondary_phone_label": c.secondary_phone_label,
                "contact_person": c.contact_person,
                "contact_title": c.contact_title,
                "assigned_to_name": c.assigned_user.email if c.assigned_user else None,
            } for c in clients
        ])
    finally:
        session.close()

