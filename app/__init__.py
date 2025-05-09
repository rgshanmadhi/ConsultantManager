"""
Serene - Mental Health Tracker Application
===================================
A comprehensive application to help users track and monitor their mental well-being
"""
import os
from datetime import datetime

from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_session import Session
from flask_wtf.csrf import CSRFProtect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()
migrate = Migrate()
sess = Session()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-development-only')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///serene.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = False
    app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes
    
    # Initialize extensions with the app
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    migrate.init_app(app, db)
    sess.init_app(app)
    
    # Set up login configuration
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    # Template filters
    @app.template_filter('formatdate')
    def format_date_filter(date, format='%B %d, %Y'):
        """Format a date to a string with a given format"""
        if isinstance(date, str):
            try:
                date = datetime.strptime(date, '%Y-%m-%d')
            except ValueError:
                return date
        return date.strftime(format) if date else ''
    
    # Context processors
    @app.context_processor
    def inject_now():
        """Inject the current datetime into templates"""
        return {'now': datetime.utcnow()}
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    from app.routes.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)
    
    from app.routes.main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    from app.routes.journal import journal as journal_blueprint
    app.register_blueprint(journal_blueprint)
    
    from app.routes.games import games as games_blueprint
    app.register_blueprint(games_blueprint)
    
    # Register error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500
    
    return app

# Import models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.entry import Entry
from app.models.subscription import Subscription