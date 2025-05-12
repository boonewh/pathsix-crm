from quart import Blueprint, jsonify
from app.utils.auth_utils import requires_auth

accounts_bp = Blueprint("accounts", __name__, url_prefix="/api/accounts")

@accounts_bp.route("/", methods=["GET"])
@requires_auth()
async def list_accounts():
    return jsonify([
        {"id": 1, "account_number": "ACC123", "status": "active"},
        {"id": 2, "account_number": "ACC456", "status": "suspended"}
    ])