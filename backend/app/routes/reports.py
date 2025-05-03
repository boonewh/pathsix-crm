from quart import Blueprint, request, jsonify
from app.utils.security import verify_token

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@reports_bp.route("/", methods=["GET"])
async def list_reports():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    # Dummy response for now
    return jsonify([
        {"id": 1, "type": "Full Client Report"},
        {"id": 2, "type": "Upcoming Follow-ups"}
    ])
