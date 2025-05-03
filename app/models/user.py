"""
User model for the Serene application
"""
from datetime import datetime, timedelta
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app import db, login_manager

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(120))
    is_subscribed = db.Column(db.Boolean, default=False)
    is_in_trial = db.Column(db.Boolean, default=True)
    trial_end_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    entries = db.relationship('Entry', backref='author', lazy='dynamic')
    subscriptions = db.relationship('Subscription', backref='user', lazy='dynamic')
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        if self.trial_end_date is None:
            # Default trial period is 30 days
            self.trial_end_date = datetime.utcnow() + timedelta(days=30)
        
        # Handle password setting if provided
        if 'password' in kwargs:
            self.password = kwargs['password']
    
    @property
    def password(self):
        """Prevent password from being accessed"""
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        """Set password to a hashed password"""
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        """Check if hashed password matches user password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'is_subscribed': self.is_subscribed,
            'is_in_trial': self.is_in_trial,
            'trial_end_date': self.trial_end_date.isoformat() if self.trial_end_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

@login_manager.user_loader
def load_user(user_id):
    """User loader function for Flask-Login"""
    return User.query.get(int(user_id))