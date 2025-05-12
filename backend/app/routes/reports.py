from quart import Blueprint, jsonify
from app.utils.auth_utils import requires_auth

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@reports_bp.route("/", methods=["GET"])
@requires_auth()
async def list_reports():
    return jsonify([
        {"id": 1, "type": "Full Client Report"},
        {"id": 2, "type": "Upcoming Follow-ups"}
    ])
