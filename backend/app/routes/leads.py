from quart import Blueprint, request, jsonify
from app.utils.security import verify_token
from app.database import SessionLocal
from app.models import Lead

leads_bp = Blueprint("leads", __name__, url_prefix="/api/leads")


@leads_bp.route("/", methods=["GET"])
async def list_leads():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    client_id = payload["client_id"]
    db = SessionLocal()
    leads = db.query(Lead).filter(Lead.client_id == client_id).all()

    return jsonify([
        {
            "id": lead.id,
            "name": lead.name,
            "contact_person": lead.contact_person,
            "email": lead.email,
            "phone": lead.phone,
            "address": lead.address,
            "city": lead.city,
            "state": lead.state,
            "zip": lead.zip,
            "status": lead.status,
            "notes": lead.notes,
            "created_at": lead.created_at.isoformat()
        }
        for lead in leads
    ])


@leads_bp.route("/<int:lead_id>", methods=["PATCH"])
async def update_lead(lead_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    client_id = payload["client_id"]
    data = await request.get_json()

    db = SessionLocal()
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.client_id == client_id).first()

    if not lead:
        return jsonify({"error": "Lead not found"}), 404

    lead.name = data.get("name", lead.name)
    lead.contact_person = data.get("contact_person", lead.contact_person)
    lead.email = data.get("email", lead.email)
    lead.phone = data.get("phone", lead.phone)
    lead.address = data.get("address", lead.address)
    lead.city = data.get("city", lead.city)
    lead.state = data.get("state", lead.state)
    lead.zip = data.get("zip", lead.zip)
    lead.status = data.get("status", lead.status)
    lead.notes = data.get("notes", lead.notes)
    db.commit()

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
        "status": lead.status,
        "notes": lead.notes,
        "created_at": lead.created_at.isoformat()
    })


@leads_bp.route("/", methods=["POST"])
async def create_lead():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    client_id = payload["client_id"]
    data = await request.get_json()

    name = data.get("name")
    contact_person = data.get("contact_person")
    email = data.get("email")
    phone = data.get("phone")
    address = data.get("address")
    city = data.get("city")
    state = data.get("state")
    zip_code = data.get("zip")
    lead_status = data.get("status", "new")
    notes = data.get("notes")

    if not name:
        return jsonify({"error": "Name is required"}), 400

    db = SessionLocal()
    new_lead = Lead(
        client_id=client_id,
        name=name,
        contact_person=contact_person,
        email=email,
        phone=phone,
        address=address,
        city=city,
        state=state,
        zip=zip_code,
        status=lead_status,
        notes=notes
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    return jsonify({
        "id": new_lead.id,
        "name": new_lead.name,
        "contact_person": new_lead.contact_person,
        "email": new_lead.email,
        "phone": new_lead.phone,
        "address": new_lead.address,
        "city": new_lead.city,
        "state": new_lead.state,
        "zip": new_lead.zip,
        "status": new_lead.status,
        "notes": new_lead.notes,
        "created_at": new_lead.created_at.isoformat()
    }), 201
