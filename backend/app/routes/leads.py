from quart import Blueprint, request, jsonify
from datetime import datetime
from app.models import Lead, ActivityLog, ActivityType
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth

leads_bp = Blueprint("leads", __name__, url_prefix="/api/leads")

@leads_bp.route("/", methods=["GET"])
@requires_auth()
async def list_leads():
    user = request.user
    session = SessionLocal()
    try:
        leads = session.query(Lead).filter(
            Lead.tenant_id == user.tenant_id,
            Lead.created_by == user.id,
            Lead.deleted_at == None
        ).all()

        return jsonify([
            {
                "id": l.id,
                "name": l.name,
                "contact_person": l.contact_person,
                "email": l.email,
                "phone": l.phone,
                "address": l.address,
                "city": l.city,
                "state": l.state,
                "zip": l.zip,
                "notes": l.notes,
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
            tenant_id=user.tenant_id,
            created_by=user.id,
            name=data["name"],
            contact_person=data.get("contact_person"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            zip=data.get("zip"),
            notes=data.get("notes"),
            created_at=datetime.utcnow()
        )
        session.add(lead)
        session.commit()
        session.refresh(lead)
        return jsonify({"id": lead.id}), 201
    finally:
        session.close()

@leads_bp.route("/<int:lead_id>", methods=["GET"])
@requires_auth()
async def get_lead(lead_id):
    user = request.user
    session = SessionLocal()
    try:
        lead = session.query(Lead).filter(
            Lead.id == lead_id,
            Lead.tenant_id == user.tenant_id,
            Lead.created_by == user.id,
            Lead.deleted_at == None
        ).first()

        if not lead:
            return jsonify({"error": "Lead not found"}), 404

        # ✅ Log the view
        log = ActivityLog(
            tenant_id=user.tenant_id,
            user_id=user.id,
            action=ActivityType.viewed,
            entity_type="lead",
            entity_id=lead.id,
            description=f"Viewed lead '{lead.name}'"
        )
        session.add(log)

        session.commit()
        session.refresh(lead)

        return jsonify({
            "id": lead.id,
            "name": lead.name,
            "contact_person": lead.contact_person,
            "email": lead.email,
            "phone": lead.phone,
            "address": lead.address,
            "city": lead.city,
            "state": lead.state,
            "zip": lead.zip,
            "notes": lead.notes,
            "created_at": lead.created_at.isoformat()
        })
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
            Lead.tenant_id == user.tenant_id,
            Lead.created_by == user.id,
            Lead.deleted_at == None
        ).first()

        if not lead:
            return jsonify({"error": "Lead not found"}), 404

        for field in [
            "name", "contact_person", "email", "phone",
            "address", "city", "state", "zip", "notes"
        ]:
            if field in data:
                setattr(lead, field, data[field])

        lead.updated_by = user.id
        lead.updated_at = datetime.utcnow()

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
            Lead.tenant_id == user.tenant_id,
            Lead.created_by == user.id,
            Lead.deleted_at == None
        ).first()

        if not lead:
            return jsonify({"error": "Lead not found"}), 404

        lead.deleted_at = datetime.utcnow()
        lead.deleted_by = user.id
        session.commit()
        return jsonify({"message": "Lead soft-deleted successfully"})
    finally:
        session.close()
