from quart import Blueprint, request, jsonify
from app.utils.security import verify_token

leads_bp = Blueprint("leads", __name__, url_prefix="/api/leads")

@leads_bp.route("/", methods=["GET"])
async def list_leads():
    # Skip auth for now
    # payload, error_response, status = verify_token(request)
    # if error_response:
    #     return jsonify(error_response), status

    return jsonify([
        {"id": 1, "name": "John Smith"},
        {"id": 2, "name": "Sara Davis"}
    ])
