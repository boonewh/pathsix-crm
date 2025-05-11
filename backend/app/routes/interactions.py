from quart import Blueprint, request, jsonify
from app.database import SessionLocal
from app.utils.security import verify_token
from app.models import Interaction
from datetime import datetime

interactions_bp = Blueprint("interactions", __name__, url_prefix="/api/interactions")

@interactions_bp.route("/", methods=["GET"])
async def list_interactions():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    db = SessionLocal()
    interactions = db.query(Interaction).all()  # You can filter by client_id or lead_id on the frontend

    return jsonify([
        {
            "id": i.id,
            "contact_date": i.contact_date.isoformat(),
            "outcome": i.outcome,
            "notes": i.notes,
            "follow_up": i.follow_up.isoformat() if i.follow_up else None,
            "client_id": i.client_id,
            "lead_id": i.lead_id,
            "client_name": i.client.name if i.client else None,
            "lead_name": i.lead.name if i.lead else None,
            "contact_person": i.client.contact_person if i.client else (i.lead.contact_person if i.lead else None),
            "email": i.client.email if i.client else (i.lead.email if i.lead else None),
            "phone": i.client.phone if i.client else (i.lead.phone if i.lead else None),
            "profile_link": f"/clients/{i.client_id}" if i.client_id else (f"/leads/{i.lead_id}" if i.lead_id else None),
        }
        for i in interactions
    ])


@interactions_bp.route("/", methods=["POST"])
async def create_interaction():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    data = await request.get_json()
    db = SessionLocal()

    new_interaction = Interaction(
        contact_date=datetime.fromisoformat(data["contact_date"]),
        outcome=data["outcome"],
        notes=data["notes"],
        follow_up=datetime.fromisoformat(data["follow_up"]) if data.get("follow_up") else None,
        client_id=data.get("client_id"),
        lead_id=data.get("lead_id"),
    )

    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)

    return jsonify({
        "id": new_interaction.id,
        "contact_date": new_interaction.contact_date.isoformat(),
        "outcome": new_interaction.outcome,
        "notes": new_interaction.notes,
        "follow_up": new_interaction.follow_up.isoformat() if new_interaction.follow_up else None,
        "client_id": new_interaction.client_id,
        "lead_id": new_interaction.lead_id,
    }), 201

@interactions_bp.route("/<int:interaction_id>", methods=["PUT"])
async def update_interaction(interaction_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    data = await request.get_json()
    db = SessionLocal()
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()

    if not interaction:
        return jsonify({"error": "Interaction not found"}), 404

    interaction.contact_date = datetime.fromisoformat(data.get("contact_date")) if data.get("contact_date") else interaction.contact_date
    interaction.outcome = data.get("outcome", interaction.outcome)
    interaction.notes = data.get("notes", interaction.notes)
    interaction.follow_up = datetime.fromisoformat(data.get("follow_up")) if data.get("follow_up") else None

    db.commit()
    db.refresh(interaction)

    return jsonify({
        "id": interaction.id,
        "lead_id": interaction.lead_id,
        "client_id": interaction.client_id,
        "contact_date": interaction.contact_date.isoformat(),
        "outcome": interaction.outcome,
        "notes": interaction.notes,
        "follow_up": interaction.follow_up.isoformat() if interaction.follow_up else None
    })


@interactions_bp.route("/<int:interaction_id>", methods=["DELETE"])
async def delete_interaction(interaction_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    db = SessionLocal()
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()

    if not interaction:
        return jsonify({"error": "Interaction not found"}), 404

    db.delete(interaction)
    db.commit()
    return jsonify({"message": "Interaction deleted"})
