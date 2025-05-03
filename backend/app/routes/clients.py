from quart import Blueprint, jsonify
from app.utils.security import verify_token
from quart import request

clients_bp = Blueprint("clients", __name__, url_prefix="/api/clients")

@clients_bp.route("/", methods=["GET"])
async def list_clients():
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    # Dummy response for now
    return jsonify([
        {"id": 1, "name": "Acme Inc."},
        {"id": 2, "name": "Globex Corp"}
    ])
