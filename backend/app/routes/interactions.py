from quart import Blueprint, request, jsonify, Response
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, and_
from icalendar import Calendar, Event

from app.models import Interaction, Client, Lead, FollowUpStatus
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth

interactions_bp = Blueprint("interactions", __name__, url_prefix="/api/interactions")


@interactions_bp.route("/", methods=["GET"])
@requires_auth()
async def list_interactions():
    user = request.user
    session = SessionLocal()
    try:
        client_id = request.args.get("client_id")
        lead_id = request.args.get("lead_id")

        if client_id and lead_id:
            return jsonify({"error": "Cannot filter by both client_id and lead_id"}), 400

        query = session.query(Interaction).options(
            joinedload(Interaction.client),
            joinedload(Interaction.lead)
        ).filter(Interaction.tenant_id == user.tenant_id)

        query = query.filter(
            or_(
                Interaction.client.has(Client.created_by == user.id),
                Interaction.lead.has(
                    or_(
                        Lead.created_by == user.id,
                        Lead.assigned_to == user.id
                    )
                )
            )
        )

        if client_id:
            query = query.filter(
                Interaction.client_id == int(client_id),
                Interaction.lead_id == None
            )
        elif lead_id:
            query = query.filter(
                Interaction.lead_id == int(lead_id),
                Interaction.client_id == None
            )

        interactions = query.order_by(Interaction.contact_date.desc()).all()

        response = jsonify([
            {
                "id": i.id,
                "contact_date": i.contact_date.isoformat(),
                "follow_up": i.follow_up.isoformat() if i.follow_up else None,
                "summary": i.summary,
                "outcome": i.outcome,
                "notes": i.notes,
                "client_id": i.client_id,
                "lead_id": i.lead_id,
                "client_name": i.client.name if i.client else None,
                "lead_name": i.lead.name if i.lead else None,
                "contact_person": i.client.contact_person if i.client else i.lead.contact_person if i.lead else None,
                "email": i.client.email if i.client else i.lead.email if i.lead else None,
                "phone": i.client.phone if i.client else i.lead.phone if i.lead else None,
                "phone_label": i.client.phone_label if i.client else i.lead.phone_label if i.lead else None,
                "secondary_phone": i.client.secondary_phone if i.client else i.lead.secondary_phone if i.lead else None,
                "secondary_phone_label": i.client.secondary_phone_label if i.client else i.lead.secondary_phone_label if i.lead else None,
                "followup_status": i.followup_status.value if i.followup_status else None,
                "profile_link": f"/clients/{i.client_id}" if i.client_id else f"/leads/{i.lead_id}" if i.lead_id else None
            } for i in interactions
        ])
        response.headers["Cache-Control"] = "no-store"
        return response
    finally:
        session.close()


@interactions_bp.route("/", methods=["POST"])
@requires_auth()
async def create_interaction():
    data = await request.get_json()
    user = request.user
    session = SessionLocal()
    try:
        if bool(data.get("client_id")) == bool(data.get("lead_id")):
            return jsonify({"error": "Interaction must link to either client_id or lead_id, not both or neither."}), 400

        interaction = Interaction(
            tenant_id=user.tenant_id,
            client_id=int(data["client_id"]) if data.get("client_id") else None,
            lead_id=int(data["lead_id"]) if data.get("lead_id") else None,
            contact_date=datetime.fromisoformat(data["contact_date"]),
            summary=data["summary"],
            outcome=data.get("outcome"),
            notes=data.get("notes"),
            follow_up=datetime.fromisoformat(data["follow_up"]) if data.get("follow_up") else None,
            contact_person=data.get("contact_person"),
            email=data.get("email"),
            phone=data.get("phone")
        )
        session.add(interaction)
        session.commit()
        session.refresh(interaction)

        return jsonify({"id": interaction.id}), 201
    finally:
        session.close()


@interactions_bp.route("/<int:interaction_id>", methods=["PUT"])
@requires_auth()
async def update_interaction(interaction_id):
    data = await request.get_json()
    user = request.user
    session = SessionLocal()
    try:
        interaction = session.query(Interaction).filter(
            Interaction.id == interaction_id,
            Interaction.tenant_id == user.tenant_id
        ).first()

        if not interaction:
            return jsonify({"error": "Interaction not found"}), 404

        for field in [
            "contact_date", "summary", "outcome",
            "notes", "follow_up", "contact_person", "email", "phone"
        ]:
            if field in data:
                if field in ["contact_date", "follow_up"]:
                    setattr(interaction, field, datetime.fromisoformat(data[field]) if data[field] else None)
                else:
                    setattr(interaction, field, data[field] or None)

        session.commit()
        session.refresh(interaction)
        return jsonify({"id": interaction.id})
    finally:
        session.close()


@interactions_bp.route("/<int:interaction_id>", methods=["DELETE"])
@requires_auth()
async def delete_interaction(interaction_id):
    user = request.user
    session = SessionLocal()
    try:
        interaction = session.query(Interaction).filter(
            Interaction.id == interaction_id,
            Interaction.tenant_id == user.tenant_id
        ).first()

        if not interaction:
            return jsonify({"error": "Interaction not found"}), 404

        session.delete(interaction)
        session.commit()
        return jsonify({"message": "Interaction deleted"})
    finally:
        session.close()


@interactions_bp.route("/transfer", methods=["POST"])
@requires_auth()
async def transfer_interactions():
    data = await request.get_json()
    from_lead_id = data.get("from_lead_id")
    to_client_id = data.get("to_client_id")
    user = request.user

    if not from_lead_id or not to_client_id:
        return jsonify({"error": "Missing from_lead_id or to_client_id"}), 400

    session = SessionLocal()
    try:
        interactions = session.query(Interaction).filter(
            Interaction.tenant_id == user.tenant_id,
            Interaction.lead_id == from_lead_id
        ).all()

        for interaction in interactions:
            interaction.lead_id = None
            interaction.client_id = to_client_id

        session.commit()

        return jsonify({
            "success": True,
            "transferred": len(interactions)
        })
    finally:
        session.close()


@interactions_bp.route("/<int:interaction_id>/calendar.ics", methods=["GET"])
async def get_interaction_ics(interaction_id):
    session = SessionLocal()
    try:
        interaction = session.query(Interaction).filter(
            Interaction.id == interaction_id
        ).first()

        if not interaction:
            return Response("Interaction not found", status=404)

        if not interaction.follow_up:
            return Response("This interaction has no follow-up date", status=400)

        cal = Calendar()
        cal.add("prodid", "-//PathSix CRM//EN")
        cal.add("version", "2.0")

        event = Event()
        event.add("summary", f"Follow-up: {interaction.contact_person or 'CRM Interaction'}")
        event.add("dtstart", interaction.follow_up)
        event.add("dtend", interaction.follow_up)
        event.add("dtstamp", interaction.contact_date)
        event.add("description", f"Outcome: {interaction.outcome or ''}\nNotes: {interaction.notes or ''}")
        event.add("location", f"Phone: {interaction.phone or ''}\nEmail: {interaction.email or ''}")
        event["uid"] = f"interaction-{interaction.id}@pathsixcrm"

        cal.add_component(event)
        ics_content = cal.to_ical()

        return Response(
            ics_content,
            content_type="text/calendar",
            headers={
                "Content-Disposition": f"attachment; filename=interaction-{interaction.id}.ics"
            }
        )
    finally:
        session.close()


@interactions_bp.route("/<int:interaction_id>/complete", methods=["PUT"])
@requires_auth()
async def complete_interaction(interaction_id):
    user = request.user
    session = SessionLocal()
    try:
        interaction = session.query(Interaction).filter(
            Interaction.id == interaction_id,
            Interaction.tenant_id == user.tenant_id
        ).first()

        if not interaction:
            return jsonify({"error": "Interaction not found"}), 404

        interaction.followup_status = FollowUpStatus.completed
        session.commit()
        return jsonify({"message": "Interaction marked as completed"})
    finally:
        session.close()

@interactions_bp.route("/all", methods=["GET"])
@requires_auth(roles=["admin"])
async def list_all_interactions_admin():
    user = request.user
    session = SessionLocal()
    try:
        interactions = session.query(Interaction).options(
            joinedload(Interaction.client).joinedload(Client.assigned_user),
            joinedload(Interaction.client).joinedload(Client.created_by_user),
            joinedload(Interaction.lead).joinedload(Lead.assigned_user),
            joinedload(Interaction.lead).joinedload(Lead.created_by_user)
        ).filter(
            Interaction.tenant_id == user.tenant_id
        ).order_by(Interaction.contact_date.desc()).all()

        return jsonify([{
            "id": i.id,
            "contact_date": i.contact_date.isoformat(),
            "follow_up": i.follow_up.isoformat() if i.follow_up else None,
            "summary": i.summary,
            "outcome": i.outcome,
            "notes": i.notes,
            "client_id": i.client_id,
            "lead_id": i.lead_id,
            "client_name": i.client.name if i.client else None,
            "lead_name": i.lead.name if i.lead else None,
            "contact_person": (
                i.contact_person.strip() if i.contact_person and i.contact_person.strip()
                else i.client.contact_person if i.client
                else i.lead.contact_person if i.lead
                else None
            ),
            "email": (
                i.email or
                i.client.email if i.client else
                i.lead.email if i.lead else None
            ),
            "phone": (
                i.phone or
                i.client.phone if i.client else
                i.lead.phone if i.lead else None
            ),
            "followup_status": i.followup_status.value if i.followup_status else None,
            "profile_link": f"/clients/{i.client_id}" if i.client_id else f"/leads/{i.lead_id}" if i.lead_id else None,
            "assigned_to_name": (
                i.client.assigned_user.email if i.client and i.client.assigned_user
                else i.client.created_by_user.email if i.client and i.client.created_by_user
                else i.lead.assigned_user.email if i.lead and i.lead.assigned_user
                else i.lead.created_by_user.email if i.lead and i.lead.created_by_user
                else None
            )
        } for i in interactions])
    finally:
        session.close()
