from quart import Quart
from quart_cors import cors
from app.routes.accounts import accounts_bp
from app.routes.auth import auth_bp
from app.routes.clients import clients_bp
from app.routes.interactions import interactions_bp
from app.routes.leads import leads_bp
from app.routes.projects import projects_bp
from app.routes.reports import reports_bp
from app.routes import register_blueprints

def create_app():
    app = Quart(__name__)
    app = cors(app, allow_origin="http://localhost:5173")
    app.register_blueprint(accounts_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(interactions_bp)
    app.register_blueprint(leads_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(reports_bp)
    return app