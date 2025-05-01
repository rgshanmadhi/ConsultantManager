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
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'status': self.status,
            'currentPeriodStart': self.current_period_start.strftime('%Y-%m-%d'),
            'currentPeriodEnd': self.current_period_end.strftime('%Y-%m-%d'),
            'createdAt': self.created_at.strftime('%Y-%m-%d'),
        }