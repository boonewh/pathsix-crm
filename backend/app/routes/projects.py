from quart import Blueprint, request, jsonify
from datetime import datetime
from app.models import Project
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")

@projects_bp.route("/", methods=["GET"])
@requires_auth()
async def list_projects():
    user = request.user
    session = SessionLocal()
    try:
        projects = session.query(Project).filter(Project.tenant_id == user.tenant_id).all()
        return jsonify([
            {
                "id": p.id,
                "title": p.project_name,
                "status": p.project_status,
                "created_at": p.created_at.isoformat()
            } for p in projects
        ])
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
            project_name=data["title"],
            project_status=data.get("status", "pending"),
            project_description=data.get("description"),
            project_start=datetime.fromisoformat(data["start"]) if data.get("start") else None,
            project_end=datetime.fromisoformat(data["end"]) if data.get("end") else None,
            project_worth=data.get("worth"),
            created_by=user.id,
            created_at=datetime.utcnow()
        )
        session.add(project)
        session.commit()
        session.refresh(project)
        return jsonify({"id": project.id}), 201
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

        for field, attr in [
            ("title", "project_name"),
            ("status", "project_status"),
            ("description", "project_description"),
            ("start", "project_start"),
            ("end", "project_end"),
            ("worth", "project_worth")
        ]:
            if field in data:
                value = data[field]
                if attr in ["project_start", "project_end"] and value:
                    value = datetime.fromisoformat(value)
                setattr(project, attr, value)

        session.commit()
        session.refresh(project)
        return jsonify({"id": project.id})
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
