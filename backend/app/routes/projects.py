from quart import Blueprint, request, jsonify
from app.utils.security import verify_token

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")

@projects_bp.route("/", methods=["GET"])
async def list_projects():
    # payload, error_response, status = verify_token(request)
    # if error_response:
    #     return jsonify(error_response), status

    return jsonify([
        {"id": 1, "title": "Turf Installation", "status": "won"},
        {"id": 2, "title": "Rock Removal", "status": "pending"}
    ])
