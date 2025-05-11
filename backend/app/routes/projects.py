from quart import Blueprint, request, jsonify
from app.utils.security import verify_token
from app.database import SessionLocal
from app.models import Project
from datetime import datetime

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


@projects_bp.route("/", methods=["GET"])
async def list_projects():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    db = SessionLocal()
    projects = db.query(Project).all()

    return jsonify([
        {
            "id": p.id,
            "project_name": p.project_name,
            "project_status": p.project_status,
            "project_description": p.project_description,
            "project_worth": p.project_worth,
            "project_start": p.project_start.isoformat() if p.project_start else None,
            "project_end": p.project_end.isoformat() if p.project_end else None,
            "lead_id": p.lead_id,
            "client_id": p.client_id,
        } for p in projects
    ])


@projects_bp.route("/", methods=["POST"])
async def create_project():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    data = await request.get_json()
    db = SessionLocal()

    project = Project(
        project_name=data["project_name"],
        project_status=data["project_status"],
        project_description=data.get("project_description"),
        project_worth=data.get("project_worth"),
        project_start=datetime.fromisoformat(data["project_start"]) if data.get("project_start") else None,
        project_end=datetime.fromisoformat(data["project_end"]) if data.get("project_end") else None,
        lead_id=data.get("lead_id"),
        client_id=data.get("client_id"),
        created_by=payload["client_id"]  # Or use a real user_id if you implement users
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return jsonify({"id": project.id})


@projects_bp.route("/<int:project_id>", methods=["PUT"])
async def update_project(project_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    data = await request.get_json()
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        return jsonify({"error": "Project not found"}), 404

    project.project_name = data.get("project_name", project.project_name)
    project.project_status = data.get("project_status", project.project_status)
    project.project_description = data.get("project_description", project.project_description)
    project.project_worth = data.get("project_worth", project.project_worth)
    project.project_start = datetime.fromisoformat(data["project_start"]) if data.get("project_start") else project.project_start
    project.project_end = datetime.fromisoformat(data["project_end"]) if data.get("project_end") else project.project_end
    project.last_updated_by = payload["client_id"]

    db.commit()
    db.refresh(project)

    return jsonify({"id": project.id})


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
async def delete_project(project_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        return jsonify({"error": "Project not found"}), 404

    db.delete(project)
    db.commit()

    return jsonify({"message": "Project deleted"})
