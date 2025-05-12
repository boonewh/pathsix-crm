from quart import Blueprint, request, jsonify
from datetime import datetime
from app.models import Lead
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth

leads_bp = Blueprint("leads", __name__, url_prefix="/api/leads")

@leads_bp.route("/", methods=["GET"])
@requires_auth()
async def list_leads():
    user = request.user
    session = SessionLocal()
    try:
        leads = session.query(Lead).filter(Lead.client_id == user.client_id).all()
        return jsonify([
            {
                "id": l.id,
                "name": l.name,
                "email": l.email,
                "phone": l.phone,
                "address": l.address,
                "created_at": l.created_at.isoformat()
            } for l in leads
        ])
    finally:
        session.close()

@leads_bp.route("/", methods=["POST"])
@requires_auth()
async def create_lead():
    user = request.user
    data = await request.get_json()
    session = SessionLocal()
    try:
        lead = Lead(
            client_id=user.client_id,
            name=data["name"],
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            created_at=datetime.utcnow()
        )
        session.add(lead)
        session.commit()
        session.refresh(lead)
        return jsonify({"id": lead.id}), 201
    finally:
        session.close()

@leads_bp.route("/<int:lead_id>", methods=["PUT"])
@requires_auth()
async def update_lead(lead_id):
    user = request.user
    data = await request.get_json()
    session = SessionLocal()
    try:
        lead = session.query(Lead).filter(
            Lead.id == lead_id,
            Lead.client_id == user.client_id
        ).first()

        if not lead:
            return jsonify({"error": "Lead not found"}), 404

        lead.name = data.get("name", lead.name)
        lead.email = data.get("email", lead.email)
        lead.phone = data.get("phone", lead.phone)
        lead.address = data.get("address", lead.address)

        session.commit()
        session.refresh(lead)
        return jsonify({"id": lead.id})
    finally:
        session.close()

@leads_bp.route("/<int:lead_id>", methods=["DELETE"])
@requires_auth()
async def delete_lead(lead_id):
    user = request.user
    session = SessionLocal()
    try:
        lead = session.query(Lead).filter(
            Lead.id == lead_id,
            Lead.client_id == user.client_id
        ).first()

        if not lead:
            return jsonify({"error": "Lead not found"}), 404

        session.delete(lead)
        session.commit()
        return jsonify({"message": "Lead deleted"})
    finally:
        session.close()
