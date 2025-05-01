from datetime import datetime, timedelta
from flask_login import UserMixin
from app import db, login_manager
from passlib.hash import pbkdf2_sha256 as sha256

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
        # Set trial end date to 30 days from now
        self.trial_end_date = datetime.utcnow() + timedelta(days=30)
    
    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self.password_hash = sha256.hash(password)
    
    def verify_password(self, password):
        return sha256.verify(password, self.password_hash)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'isSubscribed': self.is_subscribed,
            'isInTrial': self.is_in_trial,
            'trialEndDate': self.trial_end_date.strftime('%Y-%m-%d') if self.trial_end_date else None,
            'createdAt': self.created_at.strftime('%Y-%m-%d'),
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))