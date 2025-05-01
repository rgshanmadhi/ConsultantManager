import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from datetime import datetime, timedelta
from flask_session import Session
from flask_wtf.csrf import CSRFProtect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()
sess = Session()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configure app
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///serene.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Session configuration
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    sess.init_app(app)
    
    # Configure login
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models.user import User, load_user
    from app.models.entry import Entry
    from app.models.subscription import Subscription
    
    # Register the user loader function
    login_manager.user_loader(load_user)
    
    # Register blueprints
    from app.routes.auth import auth
    from app.routes.main import main
    from app.routes.journal import journal
    from app.routes.games import games
    
    app.register_blueprint(auth)
    app.register_blueprint(main)
    app.register_blueprint(journal)
    app.register_blueprint(games)
    
    # Context processor to provide global template variables
    @app.context_processor
    def inject_now():
        return {'now': datetime.utcnow()}
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app