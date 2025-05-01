from datetime import datetime
from app import db

class Entry(db.Model):
    __tablename__ = 'entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    mood = db.Column(db.String(20), nullable=False)  # "Happy", "Neutral", "Sad", "Angry", "Tired"
    journal_entry = db.Column(db.Text, nullable=False)
    sentiment = db.Column(db.String(20), nullable=True)  # "Positive", "Neutral", "Negative"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'date': self.date.isoformat(),
            'mood': self.mood,
            'journalEntry': self.journal_entry,
            'sentiment': self.sentiment,
            'createdAt': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Entry {self.id} - {self.date.strftime("%Y-%m-%d")}>'