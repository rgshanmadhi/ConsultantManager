from datetime import datetime
from app import db

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active')  # active, canceled, past_due
    current_period_start = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    current_period_end = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Optional fields for more complex subscription handling
    stripe_customer_id = db.Column(db.String(120), nullable=True)
    stripe_subscription_id = db.Column(db.String(120), nullable=True)
    plan = db.Column(db.String(20), nullable=False, default='monthly')  # monthly, annual
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'status': self.status,
            'currentPeriodStart': self.current_period_start.isoformat(),
            'currentPeriodEnd': self.current_period_end.isoformat(),
            'plan': self.plan,
            'createdAt': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Subscription {self.id} - {self.status}>'