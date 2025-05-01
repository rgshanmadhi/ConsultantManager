# Import routes to make them available when importing from app.routes
from app.routes.auth import auth_bp
from app.routes.main import main_bp
from app.routes.journal import journal_bp
from app.routes.games import games_bp