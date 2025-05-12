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
        projects = session.query(Project).filter(Project.client_id == user.client_id).all()
        return jsonify([
            {
                "id": p.id,
                "title": p.title,
                "status": p.status,
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
            client_id=user.client_id,
            title=data["title"],
            status=data.get("status"),
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
            Project.client_id == user.client_id
        ).first()

        if not project:
            return jsonify({"error": "Project not found"}), 404

        for field in ["title", "status"]:
            if field in data:
                setattr(project, field, data[field])

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
            Project.client_id == user.client_id
        ).first()

        if not project:
            return jsonify({"error": "Project not found"}), 404

        session.delete(project)
        session.commit()
        return jsonify({"message": "Project deleted"})
    finally:
        session.close()