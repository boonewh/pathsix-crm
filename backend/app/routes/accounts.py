from quart import Blueprint, request, jsonify
from app.utils.security import verify_token

accounts_bp = Blueprint("accounts", __name__, url_prefix="/api/accounts")

@accounts_bp.route("/", methods=["GET"])
async def list_accounts():
    # payload, error_response, status = verify_token(request)
    # if error_response:
    #     return jsonify(error_response), status

    return jsonify([
        { "id": 1, "account_number": "ACC123", "status": "active" },
        { "id": 2, "account_number": "ACC456", "status": "suspended" }
    ])
