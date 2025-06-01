from quart import Blueprint, request, jsonify
from datetime import datetime
from app.models import Project, ActivityLog, ActivityType
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth
from sqlalchemy.orm import joinedload

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")

@projects_bp.route("/", methods=["GET"])
@requires_auth()
async def list_projects():
    user = request.user
    session = SessionLocal()
    try:
        projects = session.query(Project).options(
            joinedload(Project.client),
            joinedload(Project.lead)
        ).filter(Project.tenant_id == user.tenant_id).all()

        return jsonify([
            {
                "id": p.id,
                "project_name": p.project_name,
                "project_status": p.project_status,
                "project_description": p.project_description,
                "project_start": p.project_start.isoformat() if p.project_start else None,
                "project_end": p.project_end.isoformat() if p.project_end else None,
                "project_worth": p.project_worth,
                "client_id": p.client_id,
                "lead_id": p.lead_id,
                "client_name": p.client.name if p.client else None,
                "lead_name": p.lead.name if p.lead else None,
                "created_at": p.created_at.isoformat() if p.created_at else None
            } for p in projects
        ])
    finally:
        session.close()

@projects_bp.route("/<int:project_id>", methods=["GET"])
@requires_auth()
async def get_project(project_id):
    user = request.user
    session = SessionLocal()
    try:
        project = session.query(Project).options(
            joinedload(Project.client),
            joinedload(Project.lead)
        ).filter(
            Project.id == project_id,
            Project.tenant_id == user.tenant_id
        ).first()

        if not project:
            return jsonify({"error": "Project not found"}), 404

        log = ActivityLog(
            tenant_id=user.tenant_id,
            user_id=user.id,
            action=ActivityType.viewed,
            entity_type="project",
            entity_id=project.id,
            description=f"Viewed project '{project.project_name}'"
        )
        session.add(log)
        session.commit()

        return jsonify({
            "id": project.id,
            "project_name": project.project_name,
            "project_status": project.project_status,
            "project_description": project.project_description,
            "project_start": project.project_start.isoformat() if project.project_start else None,
            "project_end": project.project_end.isoformat() if project.project_end else None,
            "project_worth": project.project_worth,
            "client_id": project.client_id,
            "lead_id": project.lead_id,
            "client_name": project.client.name if project.client else None,
            "lead_name": project.lead.name if project.lead else None,
            "created_by": project.created_by,
            "created_at": project.created_at.isoformat() if project.created_at else None,
        })
    finally:
        session.close()

@projects_bp.route("/", methods=["POST"])
@requires_auth()
async def create_project():
    user = request.user
    data = await request.get_json()
    session = SessionLocal()
    try:
        project = Project(
            tenant_id=user.tenant_id,
            client_id=data.get("client_id"),
            lead_id=data.get("lead_id"),
            project_name=data["project_name"],
            project_status=data.get("project_status", "pending"),
            project_description=data.get("project_description"),
            project_start=datetime.fromisoformat(data["project_start"]) if data.get("project_start") else None,
            project_end=datetime.fromisoformat(data["project_end"]) if data.get("project_end") else None,
            project_worth=data.get("project_worth"),
            created_by=user.id,
            created_at=datetime.utcnow()
        )
        session.add(project)
        session.commit()
        session.refresh(project)
        if project.client:
            session.refresh(project.client)
        if project.lead:
            session.refresh(project.lead)
        return jsonify({
            "id": project.id,
            "project_name": project.project_name,
            "project_status": project.project_status,
            "client_name": project.client.name if project.client else None,
            "lead_name": project.lead.name if project.lead else None,
        }), 201
    finally:
        session.close()

@projects_bp.route("/<int:project_id>", methods=["PUT"])
@requires_auth()
async def update_project(project_id):
    user = request.user
    data = await request.get_json()
    session = SessionLocal()
    try:
        project = session.query(Project).filter(
            Project.id == project_id,
            Project.tenant_id == user.tenant_id
        ).first()

        if not project:
            return jsonify({"error": "Project not found"}), 404

        for field in [
            "project_name",
            "project_status",
            "project_description",
            "project_start",
            "project_end",
            "project_worth",
            "client_id",
            "lead_id"
        ]:
            if field in data:
                value = data[field]
                if field in ["project_start", "project_end"] and value:
                    value = datetime.fromisoformat(value)
                setattr(project, field, value)

        session.commit()
        session.refresh(project)
        if project.client is not None:
            session.refresh(project.client)
        if project.lead is not None:
            session.refresh(project.lead)
        return jsonify({
            "id": project.id,
            "project_name": project.project_name,
            "project_status": project.project_status,
            "client_name": project.client.name if project.client else None,
            "lead_name": project.lead.name if project.lead else None,
        })
    finally:
        session.close()

@projects_bp.route("/<int:project_id>", methods=["DELETE"])
@requires_auth()
async def delete_project(project_id):
    user = request.user
    session = SessionLocal()
    try:
        project = session.query(Project).filter(
            Project.id == project_id,
            Project.tenant_id == user.tenant_id
        ).first()

        if not project:
            return jsonify({"error": "Project not found"}), 404

        session.delete(project)
        session.commit()
        return jsonify({"message": "Project deleted"})
    finally:
        session.close()
